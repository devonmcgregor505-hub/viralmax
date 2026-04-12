import re

with open('/Users/kanemcgregor/Downloads/Viralmax/app.html', 'r') as f:
    html = f.read()

# ── 1. Sidebar sub-items: replace all 7 with just 3 ──
old_sub = '''    <div class="nav-sub" id="pipe-sub" style="display:none;">
      <button class="nav-sub-item active" onclick="goPipeStep(0);switchTab('pipeline')"><span class="sub-dot"></span>Idea</button>
      <button class="nav-sub-item" onclick="goPipeStep(1);switchTab('pipeline')"><span class="sub-dot"></span>Script</button>
      <button class="nav-sub-item" onclick="goPipeStep(2);switchTab('pipeline')"><span class="sub-dot"></span>Voiceover</button>
      <button class="nav-sub-item" onclick="goPipeStep(3);switchTab('pipeline')"><span class="sub-dot"></span>Silence Remove</button>
      <button class="nav-sub-item" onclick="goPipeStep(4);switchTab('pipeline')"><span class="sub-dot"></span>Scenes</button>
      <button class="nav-sub-item" onclick="goPipeStep(5);switchTab('pipeline')"><span class="sub-dot"></span>Images</button>
      <button class="nav-sub-item" onclick="goPipeStep(6);switchTab('pipeline')"><span class="sub-dot"></span>Videos</button>
    </div>'''

new_sub = '''    <div class="nav-sub" id="pipe-sub" style="display:none;">
      <button class="nav-sub-item active" onclick="goPipeStep(0);switchTab('pipeline')"><span class="sub-dot"></span>Scenes</button>
      <button class="nav-sub-item" onclick="goPipeStep(1);switchTab('pipeline')"><span class="sub-dot"></span>Images</button>
      <button class="nav-sub-item" onclick="goPipeStep(2);switchTab('pipeline')"><span class="sub-dot"></span>Videos</button>
    </div>'''

html = html.replace(old_sub, new_sub)

# ── 2. Step nav bar: replace all 7 step buttons with 3 ──
old_stepnav = '''      <div class="step-nav" style="position:relative;"><button onclick="changeNiche()" style="margin-right:8px;padding:6px 14px;background:var(--s3);border:1px solid var(--bd2);border-radius:7px;color:var(--t2);font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;flex-shrink:0;" onmouseover="this.style.borderColor='rgba(255,230,0,0.3)';this.style.color='var(--y)'" onmouseout="this.style.borderColor='var(--bd2)';this.style.color='var(--t2)'">← Change Niche</button>
        <button class="step-btn active" id="pstep-0" onclick="goPipeStep(0)"><span class="step-num">1</span>Idea</button>
        <span class="step-div">›</span>
        <button class="step-btn locked" id="pstep-1" onclick="goPipeStep(1)"><span class="step-num">2</span>Script</button>
        <span class="step-div">›</span>
        <button class="step-btn locked" id="pstep-2" onclick="goPipeStep(2)"><span class="step-num">3</span>Voice</button>
        <span class="step-div">›</span>
        <button class="step-btn locked" id="pstep-3" onclick="goPipeStep(3)"><span class="step-num">4</span>Trim</button>
        <span class="step-div">›</span>
        <button class="step-btn locked" id="pstep-4" onclick="goPipeStep(4)"><span class="step-num">5</span>Scenes</button>
        <span class="step-div">›</span>
        <button class="step-btn locked" id="pstep-5" onclick="goPipeStep(5)"><span class="step-num">6</span>Images</button>
        <span class="step-div">›</span>
        <button class="step-btn locked" id="pstep-6" onclick="goPipeStep(6)"><span class="step-num">7</span>Videos</button>
      </div>'''

new_stepnav = '''      <div class="step-nav" style="position:relative;"><button onclick="changeNiche()" style="margin-right:8px;padding:6px 14px;background:var(--s3);border:1px solid var(--bd2);border-radius:7px;color:var(--t2);font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.15s;flex-shrink:0;" onmouseover="this.style.borderColor='rgba(255,230,0,0.3)';this.style.color='var(--y)'" onmouseout="this.style.borderColor='var(--bd2)';this.style.color='var(--t2)'">← Change Niche</button>
        <button class="step-btn active" id="pstep-0" onclick="goPipeStep(0)"><span class="step-num">1</span>Scenes</button>
        <span class="step-div">›</span>
        <button class="step-btn locked" id="pstep-1" onclick="goPipeStep(1)"><span class="step-num">2</span>Images</button>
        <span class="step-div">›</span>
        <button class="step-btn locked" id="pstep-2" onclick="goPipeStep(2)"><span class="step-num">3</span>Videos</button>
      </div>'''

html = html.replace(old_stepnav, new_stepnav)

# ── 3. Remove step panels 0,1,2,3 (Idea, Script, Voice, Trim) and replace Scenes (was pcontent-4) with pcontent-0 ──
# Remove STEP 1: IDEA panel
html = re.sub(
    r'      <!-- STEP 1: IDEA -->.*?</div>\s*</div>\s*</div>\s*</div>',
    '',
    html,
    flags=re.DOTALL
)

# Remove STEP 2: SCRIPT panel
html = re.sub(
    r'      <!-- STEP 2: SCRIPT -->.*?</div>\s*</div>\s*</div>\s*</div>',
    '',
    html,
    flags=re.DOTALL
)

# Remove STEP 3: VOICEOVER panel
html = re.sub(
    r'      <!-- STEP 3: VOICEOVER -->.*?</div>\s*</div>\s*</div>\s*</div>',
    '',
    html,
    flags=re.DOTALL
)

# Remove STEP 4: SILENCE REMOVE panel
html = re.sub(
    r'      <!-- STEP 4: SILENCE REMOVE -->.*?</div>\s*</div>\s*</div>\s*</div>',
    '',
    html,
    flags=re.DOTALL
)

# ── 4. Renumber remaining panels: pcontent-4→0, pcontent-5→1, pcontent-6→2 ──
html = html.replace('id="pcontent-4"', 'id="pcontent-0"')
html = html.replace('id="pcontent-5"', 'id="pcontent-1"')
html = html.replace('id="pcontent-6"', 'id="pcontent-2"')

# ── 5. Update Scenes step strip and add script input textarea ──
old_scenes_strip = '''            <div class="strip"><b>Step 5 — Scenes.</b> Claude splits the script into scenes with image + video prompts.</div>
            <div><label class="fl">Script Preview</label><div id="scenesScriptPrev" style="background:var(--s3);border:1px solid var(--bd);border-radius:8px;padding:9px 12px;font-size:10.5px;color:var(--t2);line-height:1.7;max-height:180px;overflow-y:auto;"></div></div>'''

new_scenes_strip = '''            <div class="strip"><b>Step 1 — Scenes.</b> Paste your script and Claude splits it into scenes with image + video prompts.</div>
            <div>
              <label class="fl">Your Script</label>
              <textarea class="ta" id="scenesScriptInput" rows="6" placeholder="Paste your script here…" oninput="pipe.script=this.value"></textarea>
            </div>'''

html = html.replace(old_scenes_strip, new_scenes_strip)

# ── 6. Update Scenes strip label for Images step ──
html = html.replace('<b>Step 6 — Images.</b>', '<b>Step 2 — Images.</b>')

# ── 7. Update Videos step strip ──
html = html.replace('<b>Step 7 — Videos.</b>', '<b>Step 3 — Videos.</b>')

# ── 8. Fix continueToImages to use step index 1 (was unlockStep(5)) ──
html = html.replace('function continueToImages(){if(!pipe.scenes.length){alert(\'Generate scenes first\');return}unlockStep(5);goPipeStep(5);renderImgGrid()}',
                    'function continueToImages(){if(!pipe.scenes.length){alert(\'Generate scenes first\');return}unlockStep(1);goPipeStep(1);renderImgGrid()}')

# ── 9. Fix continueToClips to use step index 2 (was unlockStep(6)) ──
html = html.replace('function continueToClips(){unlockStep(6);goPipeStep(6);renderClipGrid()}',
                    'function continueToClips(){unlockStep(2);goPipeStep(2);renderClipGrid()}')

# ── 10. Update topbar subtitle ──
html = html.replace('Idea → Script → Voice → Scenes → Images → Clips', 'Scenes → Images → Clips')

# ── 11. Update niche card description ──
html = html.replace('Full 7-step pipeline for skeleton content', '3-step pipeline: Scenes → Images → Clips')

# ── 12. Fix pipe state init — remove references to old steps in goPipeStep ──
# Update the pipe object steps count if hardcoded
html = html.replace("pipeline:['Automation','Idea → Script → Voice → Scenes → Images → Clips']",
                    "pipeline:['Automation','Scenes → Images → Clips']")

# ── 13. Fix runScenesGen to read from new textarea instead of pipe.script ──
html = html.replace(
    "body:JSON.stringify({script:pipe.script,idea:pipe.selectedIdea})",
    "body:JSON.stringify({script:document.getElementById('scenesScriptInput').value.trim(),idea:''})"
)

# ── 14. Fix scenesScriptPrev reference (no longer exists) — update continueToScenes ──
html = html.replace(
    "function continueToScenes(){unlockStep(4);goPipeStep(4);document.getElementById('scenesScriptPrev').textContent=pipe.script}",
    ""
)

with open('/Users/kanemcgregor/Downloads/Viralmax/app.html', 'w') as f:
    f.write(html)

print("✅ Patch applied successfully")
