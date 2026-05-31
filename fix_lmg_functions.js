const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Nuke the entire broken block from toggleLMGoal to addLMGoal and rewrite clean
html = html.replace(
  /function toggleLMGoal[\s\S]*?function updateLMGoal/,
  `function toggleLMGoal(id){
  var g=loadLMG(); var item=g.find(function(x){return x.id===id;}); if(!item)return;
  item.done=!item.done; saveLMG(g); renderLMG();
}
function updateLMGoal(id,val){
  var g=loadLMG(); var item=g.find(function(x){return x.id===id;}); if(!item)return;
  item.text=val; saveLMG(g);
}
function deleteLMGoal(id){
  saveLMG(loadLMG().filter(function(x){return x.id!==id;})); renderLMG();
}
function addLMGoal(){
  var g=loadLMG(); g.push({id:Date.now(),text:"New goal",done:false,notes:"",images:[]}); saveLMG(g); renderLMG();
  setTimeout(function(){ openLMGDetail(g[g.length-1].id); },50);
}
function updateLMGoal`
);

fs.writeFileSync('app.html', html);
console.log('Done');
