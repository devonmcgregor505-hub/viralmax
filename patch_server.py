import re

with open('/Users/kanemcgregor/Downloads/Viralmax/server.js', 'r') as f:
    content = f.read()

# Remove /pipeline/ideate route
content = re.sub(
    r"\napp\.post\('/pipeline/ideate'.*?^\}\);\n",
    '\n',
    content,
    flags=re.DOTALL | re.MULTILINE
)

# Remove /pipeline/script route
content = re.sub(
    r"\napp\.post\('/pipeline/script'.*?^\}\);\n",
    '\n',
    content,
    flags=re.DOTALL | re.MULTILINE
)

with open('/Users/kanemcgregor/Downloads/Viralmax/server.js', 'w') as f:
    f.write(content)

print("✅ server.js patched")

# Verify
with open('/Users/kanemcgregor/Downloads/Viralmax/server.js', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if 'pipeline/ideate' in line or 'pipeline/script' in line:
        print(f"  ⚠️  Still found at line {i}: {line.strip()}")

print("✅ Verification complete")
