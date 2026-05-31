const fs = require('fs');
let server = fs.readFileSync('server.js', 'utf8');

server = server.replace(
  `    const { error } = await supabase.from('users')\n      .update({ profile, updated_at: new Date().toISOString() })\n      .eq('id', userId);`,
  `    const { error } = await supabase.from('users')\n      .upsert({ id: userId, profile, updated_at: new Date().toISOString() }, { onConflict: 'id' });`
);

if(!server.includes('onConflict')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('server.js', server);
console.log('Done');
