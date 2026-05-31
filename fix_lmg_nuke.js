const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Remove ALL lmg helper functions and rewrite once cleanly
html = html.replace(
  /function toggleLMGoal[\s\S]*?\/\/ PROGRESS PHOTOS/,
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
  var g=loadLMG();
  g.push({id:Date.now(),text:"New goal",done:false,notes:"",images:[]});
  saveLMG(g); renderLMG();
  setTimeout(function(){ openLMGDetail(g[g.length-1].id); },50);
}

// PROGRESS PHOTOS`
);

fs.writeFileSync('app.html', html);
console.log('Done');
