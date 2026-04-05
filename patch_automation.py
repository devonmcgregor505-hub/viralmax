#!/usr/bin/env python3
"""
patch_automation.py
Replaces ALL existing automation tab content in index.html with the new
single clean implementation from automation_tab_new.html.

Usage:
  python3 patch_automation.py

Run from the DubShorts folder (same directory as index.html).
Creates index.html.bak before modifying.
"""

import re, shutil, sys
from pathlib import Path

INDEX   = Path('index.html')
NEW_TAB = Path('automation_tab_new.html')

if not INDEX.exists():
    sys.exit('ERROR: index.html not found. Run this from the DubShorts folder.')
if not NEW_TAB.exists():
    sys.exit('ERROR: automation_tab_new.html not found. Put it in the same folder.')

# ── Backup ──────────────────────────────────────────────────────────────────
shutil.copy(INDEX, INDEX.with_suffix('.html.bak'))
print('✓ Backed up to index.html.bak')

html = INDEX.read_text(encoding='utf-8')
new_content = NEW_TAB.read_text(encoding='utf-8')

# Split new content into three parts:
# 1. tab panel HTML  (<div class="tab-panel" id="tab-automation">…</div>)
# 2. <style> block
# 3. <script> block

# Extract tab panel from new file
panel_match = re.search(
    r'<!-- ══ AUTOMATION TAB PANEL ══ -->(.*?)(?=<!-- ══ AUTOMATION STYLES|$)',
    new_content, re.DOTALL
)
style_match = re.search(r'<!-- ══ AUTOMATION STYLES ══ -->(.*?)</style>', new_content, re.DOTALL)
script_match = re.search(r'<!-- ══ AUTOMATION SCRIPT ══ -->(.*?)</script>\s*$', new_content, re.DOTALL)

if not (panel_match and style_match and script_match):
    sys.exit('ERROR: Could not parse sections from automation_tab_new.html — check the comment markers.')

new_panel  = panel_match.group(0).strip()
new_style  = '<style>\n' + style_match.group(1).strip() + '\n</style>'
new_script = '<script>\n' + script_match.group(1).strip() + '\n</script>'

# ── Step 1: Remove ALL existing automation tab panels ───────────────────────
# Pattern matches <div class="tab-panel" id="tab-automation">…</div> (any variant)
def remove_automation_panels(html):
    """Remove all div.tab-panel#tab-automation blocks."""
    result = html
    # We'll do a bracket-depth walk to find and remove each one
    pattern = r'<div\s[^>]*class="tab-panel"[^>]*id="tab-automation"[^>]*>'
    starts = [m.start() for m in re.finditer(pattern, result)]
    if not starts:
        print('  (no existing automation tab panels found)')
        return result
    # Process in reverse so indices stay valid
    for start in reversed(starts):
        depth = 0
        i = start
        while i < len(result):
            if result[i:i+4] == '<div':
                depth += 1
                i += 4
            elif result[i:i+6] == '</div>':
                depth -= 1
                if depth == 0:
                    end = i + 6
                    result = result[:start] + result[end:]
                    print(f'  Removed automation panel at char {start}')
                    break
                i += 6
            else:
                i += 1
    return result

html = remove_automation_panels(html)

# ── Step 2: Remove old automation <style> blocks ────────────────────────────
# The old styles are identified by comment markers
old_style_patterns = [
    r'<style>\s*/\* ══ AUTOMATION STYLES ══ \*/.*?</style>',
    r'<style>\s*/\* ══ AUTOMATION TAB ══ \*/.*?</style>',
]
for pat in old_style_patterns:
    count = len(re.findall(pat, html, re.DOTALL))
    html = re.sub(pat, '', html, flags=re.DOTALL)
    if count: print(f'  Removed {count} old automation <style> block(s)')

# ── Step 3: Remove old automation <script> blocks ───────────────────────────
old_script_patterns = [
    r'<script>\s*// ══════+\s*// AUTOMATION PIPELINE STATE.*?</script>',
    r'<script>\s*const autoState\s*=.*?</script>',
]
for pat in old_script_patterns:
    count = len(re.findall(pat, html, re.DOTALL))
    html = re.sub(pat, '', html, flags=re.DOTALL)
    if count: print(f'  Removed {count} old automation <script> block(s)')

# ── Step 4: Insert new tab panel before </div>\n</div class="main"> ─────────
# Insert before the Add Voice Modal section (reliable landmark) or before </body>
# Try multiple insertion points in order of preference

landmarks = [
    '<!-- ══ ADD VOICE MODAL ══ -->',
    '<!-- ══ REPURPOSE ══ -->',   # fallback
    '</body>',
]

inserted = False
for landmark in landmarks:
    if landmark in html:
        html = html.replace(landmark, '\n\n' + new_panel + '\n\n' + landmark, 1)
        print(f'  Inserted new automation tab panel before: {landmark}')
        inserted = True
        break

if not inserted:
    # Last resort — insert before </body>
    html = html.replace('</body>', '\n\n' + new_panel + '\n\n</body>', 1)
    print('  Inserted new automation tab panel before </body>')

# ── Step 5: Insert new style + script before </body> ────────────────────────
html = html.replace('</body>', '\n\n' + new_style + '\n\n' + new_script + '\n\n</body>', 1)
print('  Inserted new automation <style> and <script> before </body>')

# ── Step 6: Fix duplicate /api/claude route in server.js ────────────────────
SERVER = Path('server.js')
if SERVER.exists():
    srv = SERVER.read_text(encoding='utf-8')
    # The first block uses claude-sonnet-4-20250514 — remove it, keep the Haiku block
    sonnet_pattern = (
        r"app\.post\('/api/claude'.*?model: 'claude-sonnet-4-20250514'.*?\}\);\s*"
    )
    before = len(srv)
    srv = re.sub(sonnet_pattern, '', srv, count=1, flags=re.DOTALL)
    if len(srv) < before:
        SERVER.write_text(srv, encoding='utf-8')
        print('✓ Removed duplicate claude-sonnet route from server.js (kept Haiku)')
    else:
        print('  (no duplicate claude-sonnet route found in server.js — skipping)')

# ── Write output ──────────────────────────────────────────────────────────────
INDEX.write_text(html, encoding='utf-8')
print('\n✅ Done! index.html updated.')
print('   Test locally: node server.js')
print('   Deploy:       git add -A && git commit -m "rebuild automation tab" && git push')
