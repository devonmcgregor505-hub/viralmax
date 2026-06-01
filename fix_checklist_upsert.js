const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

server = server.replace(
  `    const { error } = await supabase.from('checklist_logs').upsert({\n      user_id: userId,\n      date: date || new Date().toISOString().split('T')[0],\n      checked: checked,\n      updated_at: new Date().toISOString()\n    });`,
  `    const { error } = await supabase.from('checklist_logs').upsert({\n      user_id: userId,\n      date: date || new Date().toISOString().split('T')[0],\n      checked: checked,\n      updated_at: new Date().toISOString()\n    }, { onConflict: 'user_id,date' });`
);

if(!server.includes("onConflict: 'user_id,date'")){ console.error('FAIL'); process.exit(1); }
fs.writeFileSync('server.js', server);
console.log('Done');
