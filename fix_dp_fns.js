const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

const fns = `
function renderDpBlock(section,bi,block){
  const steps=block.items||[];
  return \`<div class="dp-block" id="dpblock-\${section}-\${bi}">
    <div class="dp-block-head">
      <input class="dp-block-title" value="\${(block.title||'').replace(/"/g,'&quot;')}" placeholder="Block title"
        onchange="dpSaveTitle('\${section}',\${bi},this.value)"/>
      <button class="dp-del-block" onclick="dpDelBlock('\${section}',\${bi})">✕</button>
    </div>
    \${steps.map((s,si)=>\`
      <div class="dp-step-row">
        <span class="dp-step-dash">—</span>
        <input class="dp-step-input" value="\${(s||'').replace(/"/g,'&quot;')}" placeholder="Step..."
          onchange="dpSaveStep('\${section}',\${bi},\${si},this.value)"/>
        <button class="dp-del-step" onclick="dpDelStep('\${section}',\${bi},\${si})">✕</button>
      </div>\`).join('')}
    <button class="dp-add-step" onclick="dpAddStep('\${section}',\${bi})">+ Add step</button>
  </div>\`;
}
function dpSaveTitle(section,bi,val){
  if(!_dayPlans[_activePlanDay][section]) return;
  _dayPlans[_activePlanDay][section][bi].title=val.trim();
  saveDayPlans();
}
function dpSaveStep(section,bi,si,val){
  if(!_dayPlans[_activePlanDay][section]) return;
  _dayPlans[_activePlanDay][section][bi].items[si]=val.trim();
  saveDayPlans();
}
function dpDelBlock(section,bi){
  _dayPlans[_activePlanDay][section].splice(bi,1);
  saveDayPlans();
  renderDayPlanner();
}
function dpAddBlock(section){
  _dayPlans[_activePlanDay][section].push({title:'New block',items:[]});
  saveDayPlans();
  renderDayPlanner();
  setTimeout(()=>{
    const blocks=document.querySelectorAll('.dp-block');
    blocks[blocks.length-1]?.querySelector('.dp-block-title')?.focus();
  },50);
}
function dpDelStep(section,bi,si){
  _dayPlans[_activePlanDay][section][bi].items.splice(si,1);
  saveDayPlans();
  renderDayPlanner();
}
function dpAddStep(section,bi){
  _dayPlans[_activePlanDay][section][bi].items.push('');
  saveDayPlans();
  renderDayPlanner();
  setTimeout(()=>{
    const block=document.getElementById('dpblock-'+section+'-'+bi);
    const inputs=block?.querySelectorAll('.dp-step-input');
    if(inputs?.length) inputs[inputs.length-1].focus();
  },50);
}
function copyDayToAll(){
  const current=JSON.parse(JSON.stringify(_dayPlans[_activePlanDay]));
  _dayPlans=Array.from({length:7},()=>JSON.parse(JSON.stringify(current)));
  saveDayPlans();
  alert('Applied to all days.');
}
`;

h = h.replace('</script>', fns + '</script>');
fs.writeFileSync('app.html', h);
console.log('renderDpBlock:', h.includes('function renderDpBlock'));
console.log('dpSaveTitle:', h.includes('function dpSaveTitle'));
console.log('copyDayToAll:', h.includes('function copyDayToAll'));
