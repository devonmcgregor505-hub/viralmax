const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

const MOBILE_CSS = `
@media (max-width: 600px) {
  /* Layout */
  html,body{overflow:hidden;height:100%;height:100dvh;}
  .app-body{flex-direction:column-reverse;}

  /* Hide sidebar, use bottom nav instead */
  .sidebar{display:none;}

  /* Main fills screen */
  .main{flex:1;overflow:hidden;display:flex;flex-direction:column;}
  .main-content{flex:1;overflow-y:auto;padding:14px 14px 80px;}

  /* Topbar compact */
  .topbar{padding:0 12px;height:50px;}
  .topbar-logo-text{font-size:17px;}
  .tb-badge{padding:5px 8px;font-size:11px;}
  .streak-badge{padding:5px 8px;font-size:11px;}
  .notif-btn{width:30px;height:30px;}
  .topbar-avatar{width:30px;height:30px;font-size:10px;}

  /* Bottom nav */
  .bottom-nav{display:flex;position:fixed;bottom:0;left:0;right:0;height:62px;background:rgba(9,9,18,0.97);border-top:1px solid var(--border);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:100;padding:0 4px;padding-bottom:env(safe-area-inset-bottom);}
  .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:var(--t3);font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;transition:color .15s;padding:8px 4px;border:none;background:none;font-family:inherit;}
  .bottom-nav-item svg{width:20px;height:20px;stroke-width:1.8;flex-shrink:0;}
  .bottom-nav-item.active{color:var(--y);}
  .bottom-nav-item.active svg{filter:drop-shadow(0 0 4px rgba(255,200,0,0.4));}

  /* Dropdowns full width on mobile */
  .avatar-dropdown{right:0;left:0;width:auto;margin:0 8px;border-radius:16px;}
  .notif-dropdown{right:0;left:0;width:auto;margin:0 8px;border-radius:16px;}

  /* Section title smaller */
  .section-title{font-size:18px;}

  /* Nutrition header stack on very small */
  .nutrition-header, [style*="justify-content:space-between"][style*="gap:16px"]{flex-wrap:wrap;gap:10px;}

  /* Macro cards smaller */
  .macro-card{padding:10px 12px;}
  .macro-val{font-size:24px;}

  /* Check items */
  .check-item{padding:12px 12px;}
  .check-name{font-size:13px;}

  /* Training exercise rows */
  .exercise-row{flex-wrap:wrap;gap:8px;}

  /* Progress grid 2 col */
  .progress-grid{grid-template-columns:1fr 1fr;}

  /* Calendar popup */
  .popup-box{padding:20px 16px;border-radius:16px;}

  /* Day planner tabs wrap */
  .day-tabs{gap:3px;}
  .day-tab{padding:5px 9px;font-size:11px;}
}

/* Bottom nav hidden on desktop */
.bottom-nav{display:none;}
`;

html = html.replace('</style>', MOBILE_CSS + '\n</style>');

// Add bottom nav HTML after topbar
html = html.replace(
  `<!-- APP BODY -->`,
  `<!-- BOTTOM NAV (mobile only) -->
<nav class="bottom-nav" id="bottomNav">
  <button class="bottom-nav-item active" id="bnav-checklist" onclick="showPage('checklist',null);updateBottomNav('checklist')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
    Checklist
  </button>
  <button class="bottom-nav-item" id="bnav-nutrition" onclick="showPage('nutrition',null);updateBottomNav('nutrition')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    Nutrition
  </button>
  <button class="bottom-nav-item" id="bnav-training" onclick="showPage('training',null);updateBottomNav('training')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 4v16M18 4v16M3 8h4M17 8h4M3 16h4M17 16h4"/></svg>
    Training
  </button>
  <button class="bottom-nav-item" id="bnav-progress" onclick="showPage('progress',null);updateBottomNav('progress')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    Progress
  </button>
</nav>

<!-- APP BODY -->`
);

// Add updateBottomNav JS
const BNAV_JS = `
function updateBottomNav(name){
  document.querySelectorAll('.bottom-nav-item').forEach(function(b){
    b.classList.toggle('active', b.id === 'bnav-'+name);
  });
}
`;

// Hook into showPage to also update bottom nav
html = html.replace(
  `function showPage(name,linkEl){\n  localStorage.setItem('ascend_page', name);`,
  `function showPage(name,linkEl){\n  localStorage.setItem('ascend_page', name);\n  updateBottomNav(name);`
);

html = html.replace('</script>', BNAV_JS + '\n</script>');

if(!html.includes('bottom-nav')) { console.error('FAIL'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Done');
