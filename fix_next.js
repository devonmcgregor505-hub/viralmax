const fs = require('fs');
let h = fs.readFileSync('app.html', 'utf8');

// Fix obNext to always call obComplete on last step regardless of type
h = h.replace(
  `function obNext(){
  if(obStep<OB_STEPS.length-1){obStep++;renderOB();}
  else{obComplete();}
}`,
  `function obNext(){
  // If photos step (last step), go straight to complete
  if(OB_STEPS[obStep].type==='photos'){obComplete();return;}
  if(obStep<OB_STEPS.length-1){obStep++;renderOB();}
  else{obComplete();}
}`
);

fs.writeFileSync('app.html', h);
console.log('Done');
