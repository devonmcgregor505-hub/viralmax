const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// 1. Fix onboarding overlay to allow scrolling
h = h.replace(
  `.onboarding-overlay{position:fixed;inset:0;background:rgba(7,7,14,0.97);z-index:999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);}`,
  `.onboarding-overlay{position:fixed;inset:0;background:rgba(7,7,14,0.97);z-index:999;display:flex;align-items:flex-start;justify-content:center;backdrop-filter:blur(8px);overflow-y:auto;padding:40px 0;}`
);

// 2. Fix onboarding box to not be height-constrained
h = h.replace(
  `.onboarding-box{width:100%;max-width:520px;padding:0 24px;}`,
  `.onboarding-box{width:100%;max-width:520px;padding:0 24px 48px;}`
);

// 3. Fix renderOB — photos step should NOT fall through to input renderer
// The issue is the else branch renders an input even for photos type
// Replace the else block to handle photos type properly
h = h.replace(
  `  } else {
    const val=obAnswers[obStep]||'';
    html+=\`<div class="ob-input-wrap"><input class="ob-text-input" type="number" placeholder="\${step.ph}" value="\${val}" id="obInput" oninput="obInputChange(this.value)"/><div class="ob-text-unit">\${step.unit}</div></div>\`;
    html+=\`<div class="ob-nav"><button class="ob-back" onclick="obBack()">← back</button><button class="ob-next" id="obNext" \${!val?'disabled':''} onclick="obNext()">Continue</button></div>\`;
  }
  if(step.type==='photos'){`,
  `  } else if(step.type==='input'){
    const val=obAnswers[obStep]||'';
    html+=\`<div class="ob-input-wrap"><input class="ob-text-input" type="number" placeholder="\${step.ph}" value="\${val}" id="obInput" oninput="obInputChange(this.value)"/><div class="ob-text-unit">\${step.unit}</div></div>\`;
    html+=\`<div class="ob-nav"><button class="ob-back" onclick="obBack()">← back</button><button class="ob-next" id="obNext" \${!val?'disabled':''} onclick="obNext()">Continue</button></div>\`;
  }
  if(step.type==='photos'){`
);

// 4. Fix photo grid layout — make it more compact so all 4 fit without scrolling
h = h.replace(
  `.ob-photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px;}
.ob-photo-slot{border:1.5px dashed var(--t4);border-radius:var(--rs);aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;background:var(--bg-input);}`,
  `.ob-photo-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;}
.ob-photo-slot{border:1.5px dashed var(--t4);border-radius:var(--rs);aspect-ratio:4/5;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;background:var(--bg-input);}`,
);

// 5. Fix focus index for generateRoutineFromAI (it still refs old hardcoded index)
h = h.replace(
  `  const focusIdx2=OB_STEPS.findIndex(s=>s.label==='Focus areas');
  const focus=obMulti[focusIdx2]?[...obMulti[focusIdx2]].map(i=>OB_STEPS[focusIdx2].opts[i]).filter(o=>o!=='Everything').join(', '):'—';`,
  `  const _focusIdx=OB_STEPS.findIndex(s=>s.label==='Focus areas');
  const focus=obMulti[_focusIdx]?[...obMulti[_focusIdx]].map(i=>OB_STEPS[_focusIdx].opts[i]).filter(o=>o!=='Everything').join(', '):'—';`
);

fs.writeFileSync('app.html', h);
console.log('Done');
