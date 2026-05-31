const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// The sidebar is display:none on mobile — needs to be display:flex when open
html = html.replace(
  `  .sidebar{
    position:fixed;left:-220px;top:0;bottom:0;z-index:200;
    width:220px;transition:left .25s cubic-bezier(.4,0,.2,1);
    box-shadow:none;
  }
  .sidebar.open{left:0;box-shadow:4px 0 32px rgba(0,0,0,0.5);}`,
  `  .sidebar{
    display:flex!important;
    position:fixed;left:-220px;top:0;bottom:0;z-index:200;
    width:220px;transition:left .25s cubic-bezier(.4,0,.2,1);
    box-shadow:none;
  }
  .sidebar.open{left:0;box-shadow:4px 0 32px rgba(0,0,0,0.5);}`
);

if(!html.includes('display:flex!important')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
