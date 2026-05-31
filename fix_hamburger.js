const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// 1. Add hamburger button to topbar (after logo, mobile only)
html = html.replace(
  `  <div class="topbar-right">`,
  `  <button class="hamburger" id="hamburgerBtn" onclick="toggleSidebar()">
    <span></span><span></span><span></span>
  </button>
  <div class="topbar-right">`
);

// 2. Add sidebar overlay backdrop
html = html.replace(
  `<!-- APP BODY -->`,
  `<div class="sidebar-backdrop" id="sidebarBackdrop" onclick="closeSidebar()"></div>
<!-- APP BODY -->`
);

// 3. CSS
const CSS = `
.hamburger{display:none;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;padding:6px;border-radius:8px;transition:background .15s;margin-left:auto;}
.hamburger:hover{background:rgba(255,255,255,0.06);}
.hamburger span{display:block;width:20px;height:2px;background:var(--text);border-radius:2px;transition:all .25s;}
.sidebar-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:150;backdrop-filter:blur(3px);}
@media(max-width:600px){
  .hamburger{display:flex;}
  .topbar-right{margin-left:0;}
  .sidebar{
    position:fixed;left:-220px;top:0;bottom:0;z-index:200;
    width:220px;transition:left .25s cubic-bezier(.4,0,.2,1);
    box-shadow:none;
  }
  .sidebar.open{left:0;box-shadow:4px 0 32px rgba(0,0,0,0.5);}
  .sidebar-backdrop.open{display:block;}
}`;

html = html.replace('</style>', CSS + '\n</style>');

// 4. JS
const JS = `
function toggleSidebar(){
  var sb=document.querySelector('.sidebar');
  var bd=document.getElementById('sidebarBackdrop');
  var isOpen=sb.classList.contains('open');
  sb.classList.toggle('open',!isOpen);
  bd.classList.toggle('open',!isOpen);
}
function closeSidebar(){
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebarBackdrop')?.classList.remove('open');
}
`;

html = html.replace('</script>', JS + '\n</script>');

// 5. Close sidebar when nav item clicked on mobile
html = html.replace(
  `function showPage(name,linkEl){\n  localStorage.setItem('ascend_page', name);\n  updateBottomNav(name);`,
  `function showPage(name,linkEl){\n  localStorage.setItem('ascend_page', name);\n  updateBottomNav(name);\n  closeSidebar();`
);

if(!html.includes('toggleSidebar')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
