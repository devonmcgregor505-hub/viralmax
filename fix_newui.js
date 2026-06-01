const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

const NEW_CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#050508;
  --sb:#080810;
  --c1:#0c0c16;
  --c2:#10101e;
  --c3:#141428;
  --glass:rgba(255,255,255,0.03);
  --glass2:rgba(255,255,255,0.055);
  --border:rgba(255,255,255,0.05);
  --border2:rgba(255,255,255,0.1);
  --y:#F0B429;--y2:#FFCF5C;--y3:#C8890A;
  --yd:rgba(240,180,41,0.07);--yb:rgba(240,180,41,0.2);
  --yglow:0 0 40px rgba(240,180,41,0.14);
  --text:#f0f0fc;--t1:#b8b8d8;--t2:#6a6a96;--t3:#383858;--t4:#202040;
  --grn:#00d68f;--red:#ff3d6b;--blue:#5b8fff;
  --morning:#F0B429;--day:#5b8fff;--night:#9b8cff;
  --r:14px;--rs:10px;--rxs:7px;
}
html,body{height:100%;overflow:hidden}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--text);display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.06);border-radius:2px}

/* TOPBAR */
.topbar{display:flex;align-items:center;padding:0 18px;height:52px;border-bottom:1px solid var(--border);background:rgba(5,5,8,0.92);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);gap:7px;flex-shrink:0;position:relative;z-index:100;}
.topbar::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(240,180,41,0.03),transparent 40%);pointer-events:none;}
.topbar-logo{display:flex;align-items:center;gap:8px;margin-right:auto;text-decoration:none;}
.topbar-logo-mark{width:26px;height:26px;background:linear-gradient(135deg,var(--y),var(--y3));border-radius:6px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 12px rgba(240,180,41,0.3);}
.topbar-logo-mark svg{width:13px;height:13px;fill:#000;}
.topbar-logo-text{font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:3.5px;color:var(--text);}
.topbar-nav{display:none;}
.topbar-right{display:flex;align-items:center;gap:5px;}

.tb-badge{display:inline-flex;align-items:center;gap:4px;border-radius:7px;padding:5px 10px;font-size:11px;font-weight:700;letter-spacing:.02em;cursor:pointer;transition:all .12s;border:1px solid var(--border);background:var(--glass);}
.tb-badge:hover{background:var(--glass2);}
.tb-badge-day{color:var(--t1);}
.tb-badge-score{color:var(--text);}
.tb-badge-streak{background:var(--yd);border-color:var(--yb);color:var(--y);}
.tb-badge-streak:hover{background:rgba(240,180,41,0.1);}
.topbar-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--y),var(--y3));color:#000;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s;box-shadow:0 0 0 1.5px rgba(240,180,41,0.2);}
.topbar-avatar:hover{box-shadow:0 0 0 2.5px rgba(240,180,41,0.35),var(--yglow);}
.hamburger{display:none;flex-direction:column;justify-content:center;gap:4px;background:none;border:none;cursor:pointer;padding:6px;border-radius:7px;margin-left:2px;}
.hamburger span{display:block;width:17px;height:1.5px;background:var(--t1);border-radius:1px;transition:all .2s;}
.hamburger:hover span{background:var(--text);}

/* LAYOUT */
.app-body{display:flex;flex:1;overflow:hidden;}

/* SIDEBAR */
.sidebar{width:190px;flex-shrink:0;background:var(--sb);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:12px 8px;overflow-y:auto;}
.sidebar-section{font-size:8.5px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--t3);padding:0 10px;margin:16px 0 4px;}
.sidebar-section:first-child{margin-top:2px;}
.nav-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:9px;font-size:12.5px;font-weight:500;color:var(--t2);cursor:pointer;transition:all .12s;text-decoration:none;margin-bottom:1px;position:relative;}
.nav-item:hover{color:var(--t1);background:rgba(255,255,255,0.03);}
.nav-item.active{color:var(--y);background:rgba(240,180,41,0.08);font-weight:700;}
.nav-item.active::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:2px;background:var(--y);border-radius:0 2px 2px 0;box-shadow:0 0 8px rgba(240,180,41,0.4);}
.nav-item svg{width:14px;height:14px;flex-shrink:0;stroke-width:1.8;}
.nav-item:not(.active) svg{opacity:.35;}
.sidebar-bottom{margin-top:auto;padding-top:12px;border-top:1px solid var(--border);}
.account-row{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:9px;cursor:pointer;transition:all .12s;}
.account-row:hover{background:var(--glass);}
.account-info{flex:1;min-width:0;}
.account-name{font-size:11.5px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.account-plan{font-size:9.5px;color:var(--t3);margin-top:1px;}
.sidebar-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:150;backdrop-filter:blur(4px);}

/* MAIN */
.main{flex:1;overflow:hidden;display:flex;flex-direction:column;}
.main-content{flex:1;overflow-y:auto;padding:26px 26px 44px;}

/* PANEL PAGES */
.panel-page{display:none;}
.panel-page.active{display:block;}

/* SECTION HEADER */
.section-header{margin-bottom:22px;}
.section-title{font-size:20px;font-weight:800;letter-spacing:-.025em;margin-bottom:2px;}
.section-sub{font-size:12px;color:var(--t2);}

/* CARDS */
.card{background:var(--c1);border:1px solid var(--border);border-radius:var(--r);padding:18px;}
.card+.card{margin-top:10px;}
.card-label{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--t3);margin-bottom:11px;}

/* SCORE BAR */
.cl-score-bar{display:flex;align-items:center;gap:14px;padding:16px 18px;background:var(--c1);border:1px solid var(--border);border-radius:var(--r);margin-bottom:18px;}
.cl-score-ring{position:relative;width:50px;height:50px;flex-shrink:0;}
.cl-score-ring svg{transform:rotate(-90deg);}
.cl-score-ring-track{fill:none;stroke:rgba(255,255,255,0.04);stroke-width:3.5;}
.cl-score-ring-fill{fill:none;stroke:var(--y);stroke-width:3.5;stroke-linecap:round;transition:stroke-dashoffset .4s ease;stroke-dasharray:150.8;stroke-dashoffset:150.8;}
.cl-score-ring-text{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px;color:var(--y);}
.cl-score-info{flex:1;}
.cl-score-label{font-size:14px;font-weight:800;color:var(--text);margin-bottom:2px;}
.cl-score-sub{font-size:11px;color:var(--t2);}
.cl-week{display:flex;gap:3px;margin-top:7px;}
.cl-week-day{flex:1;height:3px;border-radius:2px;background:var(--border);}
.cl-week-day.done{background:var(--y);}
.cl-week-day.today{background:rgba(240,180,41,0.3);}

/* SECTION HEADERS */
.cl-section-header{display:flex;align-items:center;justify-content:space-between;cursor:default;padding:10px 14px;border-radius:10px;margin-bottom:8px;margin-top:4px;user-select:none;}
.cl-section-morning{background:linear-gradient(135deg,rgba(240,180,41,0.09),rgba(240,180,41,0.04));border:1px solid rgba(240,180,41,0.14);}
.cl-section-day{background:linear-gradient(135deg,rgba(91,143,255,0.09),rgba(91,143,255,0.04));border:1px solid rgba(91,143,255,0.14);}
.cl-section-night{background:linear-gradient(135deg,rgba(155,140,255,0.09),rgba(155,140,255,0.04));border:1px solid rgba(155,140,255,0.14);}
.cl-section-morning .cl-section-label{color:var(--y);}
.cl-section-day .cl-section-label{color:#7aabff;}
.cl-section-night .cl-section-label{color:#b8aaff;}
.cl-section-label{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center;gap:7px;}
.cl-section-label span.count{font-size:9.5px;font-weight:600;background:rgba(255,255,255,0.07);color:var(--t2);padding:1.5px 6px;border-radius:20px;letter-spacing:0;}
.cl-section-arrow{display:none;}
.cl-section-body{overflow:hidden;transition:max-height .28s ease;}
.cl-section-body.collapsed{max-height:0!important;}

/* TICK ALL */
.cl-tick-all{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:var(--t2);font-size:10px;font-weight:700;padding:4px 10px;cursor:pointer;font-family:inherit;transition:all .12s;letter-spacing:.03em;}
.cl-tick-all:hover{border-color:var(--yb);color:var(--y);}
.cl-tick-all.done{background:rgba(0,214,143,0.08);border-color:rgba(0,214,143,0.2);color:var(--grn);}

/* CHECK ITEMS */
.check-item{display:flex;align-items:flex-start;gap:12px;padding:13px 14px;border-radius:11px;margin-bottom:5px;background:var(--c1);border:1px solid var(--border);cursor:pointer;transition:all .15s;position:relative;overflow:hidden;}
.check-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2.5px;opacity:0;transition:opacity .18s;}
.cl-morning-body .check-item::before{background:var(--morning);}
.cl-day-body .check-item::before{background:var(--day);}
.cl-night-body .check-item::before{background:var(--night);}
.check-item:hover{background:var(--c2);border-color:var(--border2);}
.check-item:hover::before{opacity:1;}
.check-item:last-child{margin-bottom:0;}
.check-box{width:20px;height:20px;border-radius:6px;border:1.5px solid rgba(255,255,255,0.13);flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;transition:all .18s;background:transparent;}
.check-box.done{background:var(--y);border-color:var(--y);box-shadow:0 0 10px rgba(240,180,41,0.25);}
.check-box.done::after{content:'✓';font-size:10px;font-weight:900;color:#000;}
.check-text{flex:1;min-width:0;}
.check-name{font-size:13.5px;font-weight:700;color:var(--text);margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,0.04);transition:all .15s;}
.check-name .check-time{font-size:10px;font-weight:500;color:var(--t3);margin-left:6px;}
.check-name.done{color:var(--t2);text-decoration:line-through;text-decoration-color:rgba(255,255,255,0.08);}
.check-desc{font-size:11.5px;color:var(--t2);}
.cl-steps{margin-top:0;padding-left:0;display:flex;flex-direction:column;gap:2px;}
.cl-step{font-size:11.5px;color:var(--t1);opacity:.7;padding:1.5px 0;line-height:1.6;display:flex;gap:7px;border:none;}
.cl-step::before{content:none;}
.cl-steps-done .cl-step{color:var(--t2);text-decoration:line-through;opacity:.4;}

/* MACRO */
.macro-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;}
.macro-card{background:var(--c2);border:1px solid var(--border);border-radius:11px;padding:14px 16px;text-align:center;transition:all .15s;cursor:pointer;}
.macro-card:hover{border-color:var(--yb);background:rgba(240,180,41,0.04);}
.macro-val{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:1px;color:var(--y);line-height:1;display:inline;}
.macro-val-unit{font-size:11px;color:var(--t2);font-weight:500;margin-left:2px;}
.macro-lbl{font-size:9px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-top:3px;font-weight:700;}
.macro-inline-input{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:1px;color:var(--y);background:transparent;border:none;border-bottom:1.5px solid var(--y);outline:none;width:80px;padding:0;text-align:center;}

/* ROUTINE BLOCKS */
.routine-item{background:var(--c1);border:1px solid var(--border);border-radius:11px;margin-bottom:7px;overflow:hidden;transition:all .12s;}
.routine-item:hover{border-color:var(--border2);}
.routine-head{display:flex;align-items:center;gap:10px;padding:13px 14px;cursor:pointer;}
.routine-time{font-size:10px;font-weight:700;letter-spacing:.05em;color:var(--t3);min-width:40px;}
.routine-title{font-size:13px;font-weight:700;flex:1;color:var(--text);}
.routine-tag{font-size:8px;font-weight:700;letter-spacing:.07em;padding:2px 8px;border-radius:20px;text-transform:uppercase;flex-shrink:0;}
.tag-skin{background:rgba(56,189,248,0.07);color:#38bdf8;border:1px solid rgba(56,189,248,0.13);}
.tag-body{background:var(--yd);color:var(--y);border:1px solid var(--yb);}
.tag-mind{background:rgba(0,214,143,0.07);color:var(--grn);border:1px solid rgba(0,214,143,0.13);}
.tag-hair{background:var(--glass);color:var(--t2);border:1px solid var(--border);}
.tag-frame{background:rgba(249,115,22,0.07);color:#f97316;border:1px solid rgba(249,115,22,0.13);}
.routine-body{padding:0 14px 13px 64px;}
.routine-body ul{list-style:none;}
.routine-body li{font-size:12px;color:var(--t1);padding:3px 0;display:flex;gap:7px;line-height:1.6;align-items:flex-start;}
.routine-body li::before{content:'—';color:var(--t3);flex-shrink:0;margin-top:1px;}
.routine-note{font-size:10.5px;color:var(--t3);font-style:italic;margin-top:8px;padding-top:8px;border-top:1px solid var(--border);}
.routine-body li span[contenteditable]{flex:1;outline:none;border-bottom:1px solid transparent;transition:border-color .15s;}
.routine-body li span[contenteditable]:focus{border-bottom-color:var(--t3);}
.ri-del{background:none;border:none;color:var(--t4);font-size:9px;cursor:pointer;padding:1px 3px;border-radius:3px;flex-shrink:0;margin-top:2px;transition:color .15s;}
.ri-del:hover{color:var(--red);}
.ri-add{background:none;border:1px dashed var(--t4);border-radius:7px;color:var(--t3);font-size:10px;padding:4px 10px;cursor:pointer;margin-top:7px;font-family:inherit;transition:all .15s;width:100%;}
.ri-add:hover{border-color:var(--t2);color:var(--t1);}
.routine-title[contenteditable]{outline:none;}
.ri-add-inline{background:none;border:1px dashed var(--t4);border-radius:var(--rxs);color:var(--t3);font-size:10px;padding:2px 8px;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;flex-shrink:0;}
.ri-add-inline:hover{border-color:var(--y);color:var(--y);}

/* TRAINING */
.training-row{display:flex;align-items:center;gap:11px;background:var(--c1);border:1px solid var(--border);border-radius:11px;padding:12px 14px;margin-bottom:6px;transition:border-color .12s;}
.training-row:hover{border-color:var(--border2);}
.tr-day{font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);min-width:28px;}
.tr-name{font-size:12.5px;font-weight:600;flex:1;color:var(--text);}
.workout-day{background:var(--c1);border:1px solid var(--border);border-radius:12px;margin-bottom:7px;overflow:hidden;}
.workout-day-head{display:flex;align-items:center;gap:10px;padding:13px 15px;cursor:pointer;transition:background .12s;}
.workout-day-head:hover{background:var(--glass);}
.workout-day-label{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);min-width:28px;}
.workout-day-name{font-size:13.5px;font-weight:700;color:var(--text);flex:1;}
.workout-day-tag{font-size:8px;font-weight:700;letter-spacing:.07em;padding:2px 8px;border-radius:20px;text-transform:uppercase;flex-shrink:0;}
.wtag-push{background:var(--yd);color:var(--y);border:1px solid var(--yb);}
.wtag-pull{background:rgba(91,143,255,0.08);color:#7aabff;border:1px solid rgba(91,143,255,0.15);}
.wtag-arms{background:rgba(155,140,255,0.08);color:#b8aaff;border:1px solid rgba(155,140,255,0.15);}
.wtag-legs{background:rgba(0,214,143,0.08);color:var(--grn);border:1px solid rgba(0,214,143,0.15);}
.wtag-cardio{background:rgba(249,115,22,0.08);color:#f97316;border:1px solid rgba(249,115,22,0.15);}
.wtag-rest{background:var(--glass);color:var(--t2);border:1px solid var(--border);}
.workout-day-arrow{font-size:10px;color:var(--t3);transition:transform .2s;}
.workout-day-arrow.open{transform:rotate(180deg);}
.workout-exercises{padding:0 15px 13px;}
.exercise-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.025);}
.exercise-row:last-child{border-bottom:none;}
.exercise-name{flex:1;font-size:12.5px;font-weight:600;color:var(--text);background:transparent;border:none;outline:none;font-family:inherit;}
.exercise-weight{display:flex;align-items:center;gap:4px;}
.exercise-weight-label{font-size:8.5px;font-weight:700;color:var(--t3);letter-spacing:.07em;text-transform:uppercase;}
.exercise-weight-input{width:50px;background:rgba(240,180,41,0.05);border:1px solid rgba(240,180,41,0.13);border-radius:7px;color:var(--y);font-family:'Bebas Neue',sans-serif;font-size:16px;padding:3px 6px;outline:none;text-align:center;}
.exercise-weight-input:focus{border-color:var(--y);}
.exercise-weight-unit{font-size:10px;color:var(--t2);font-weight:500;}
.workout-add-btn{width:100%;padding:8px;background:transparent;border:1px dashed rgba(255,255,255,0.06);border-radius:9px;color:var(--t2);font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;transition:all .12s;margin-top:8px;}
.workout-add-btn:hover{border-color:var(--y);color:var(--y);}

/* PROGRESS */
.progress-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px;}
.stat-card{background:var(--c1);border:1px solid var(--border);border-radius:12px;padding:16px;transition:border-color .12s;}
.stat-card:hover{border-color:var(--yb);}
.stat-val{font-family:'Bebas Neue',sans-serif;font-size:34px;color:var(--y);letter-spacing:1px;line-height:1;}
.stat-lbl{font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.12em;margin-top:3px;font-weight:700;}

/* BUTTONS */
.btn-y{display:inline-flex;align-items:center;gap:5px;background:linear-gradient(135deg,var(--y),var(--y3));border:none;border-radius:9px;padding:9px 18px;color:#000;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;transition:all .12s;letter-spacing:.02em;}
.btn-y:hover{opacity:.88;transform:translateY(-1px);box-shadow:0 6px 20px rgba(240,180,41,0.22);}
.btn-ghost{display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid var(--border);border-radius:9px;padding:9px 16px;color:var(--t2);font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;}
.btn-ghost:hover{border-color:var(--border2);color:var(--text);}

/* NOTIFICATIONS */
.notif-wrap,.avatar-wrap{position:relative;}
.notif-btn{width:32px;height:32px;border-radius:8px;background:var(--glass);border:1px solid var(--border);color:var(--t2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .12s;position:relative;}
.notif-btn:hover{background:var(--glass2);color:var(--text);}
.notif-btn.has-notifs{color:var(--y);border-color:var(--yb);background:var(--yd);}
.notif-badge{position:absolute;top:-4px;right:-4px;background:var(--y);color:#000;font-size:9px;font-weight:900;min-width:14px;height:14px;border-radius:7px;display:flex;align-items:center;justify-content:center;padding:0 3px;border:2px solid var(--bg);}
.notif-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:var(--c1);border:1px solid var(--border2);border-radius:14px;width:290px;z-index:999;display:none;box-shadow:0 20px 50px rgba(0,0,0,0.65);overflow:hidden;}
.notif-dropdown.open{display:block;}
.notif-header{display:flex;align-items:center;justify-content:space-between;padding:12px 15px 9px;border-bottom:1px solid var(--border);}
.notif-title{font-size:11px;font-weight:800;color:var(--text);letter-spacing:.06em;text-transform:uppercase;}
.notif-clear-all{background:none;border:none;color:var(--t3);font-size:10.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:color .12s;}
.notif-clear-all:hover{color:var(--t1);}
.notif-list{max-height:300px;overflow-y:auto;}
.notif-item{display:flex;gap:10px;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,0.03);transition:background .12s;position:relative;}
.notif-item:last-child{border-bottom:none;}
.notif-item:hover{background:var(--glass);}
.notif-item.unread::before{content:'';position:absolute;left:5px;top:50%;transform:translateY(-50%);width:4px;height:4px;border-radius:50%;background:var(--y);}
.notif-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
.notif-icon-photo{background:var(--yd);}
.notif-body{flex:1;min-width:0;}
.notif-msg{font-size:11.5px;font-weight:600;color:var(--t1);line-height:1.4;margin-bottom:2px;}
.notif-time{font-size:9.5px;color:var(--t3);}
.notif-dismiss{background:none;border:none;color:var(--t4);font-size:11px;cursor:pointer;padding:2px 3px;flex-shrink:0;transition:color .12s;}
.notif-dismiss:hover{color:var(--red);}
.notif-empty{padding:28px 14px;text-align:center;color:var(--t3);font-size:11.5px;}

/* AVATAR DROPDOWN */
.avatar-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:var(--c1);border:1px solid var(--border2);border-radius:13px;min-width:178px;padding:5px;z-index:999;display:none;box-shadow:0 14px 40px rgba(0,0,0,0.55);}
.avatar-dropdown.open{display:block;}
.dd-item{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;font-size:12.5px;font-weight:500;color:var(--t1);cursor:pointer;transition:all .12s;}
.dd-item:hover{background:var(--glass2);color:var(--text);}
.dd-item svg{width:13px;height:13px;flex-shrink:0;opacity:.55;}
.dd-divider{height:1px;background:var(--border);margin:3px 5px;}
.dd-item.danger{color:var(--red);}
.dd-item.danger:hover{background:rgba(255,61,107,0.08);}

/* POPUPS */
.popup-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(10px);}
.popup-box{background:var(--c1);border:1px solid var(--border2);border-radius:18px;padding:28px;width:90%;max-width:520px;max-height:92vh;overflow-y:auto;position:relative;z-index:999;box-shadow:0 28px 70px rgba(0,0,0,0.65);}
.popup-title{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2.5px;margin-bottom:3px;}
.popup-sub{font-size:11.5px;color:var(--t2);margin-bottom:20px;}
.popup-close{position:absolute;top:14px;right:14px;background:var(--glass);border:1px solid var(--border);border-radius:7px;color:var(--t2);font-size:12px;cursor:pointer;width:26px;height:26px;display:flex;align-items:center;justify-content:center;transition:all .12s;}
.popup-close:hover{background:var(--glass2);color:var(--text);}

/* CALENDAR */
.cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}
.cal-month{font-size:14px;font-weight:700;color:var(--text);}
.cal-nav{background:var(--glass);border:1px solid var(--border);border-radius:7px;color:var(--t2);width:28px;height:28px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .12s;}
.cal-nav:hover{color:var(--text);background:var(--glass2);}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;}
.cal-dow{font-size:9px;font-weight:700;color:var(--t3);text-align:center;padding:5px 0 8px;letter-spacing:.07em;}
.cal-day{width:100%;aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--t2);max-width:38px;margin:0 auto;}
.cal-day.empty{background:none;}
.cal-day.today{box-shadow:0 0 0 1.5px var(--grn);color:var(--grn);}
.cal-day.completed{background:rgba(240,180,41,0.1);box-shadow:0 0 0 1.5px var(--y);color:var(--y);}
.cal-day.incomplete{background:var(--glass);color:var(--t3);}

/* DAY PLANNER */
.day-tabs{display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;}
.day-tab{padding:5px 10px;border-radius:7px;font-size:11px;font-weight:700;background:var(--glass);border:1px solid var(--border);color:var(--t2);cursor:pointer;transition:all .12s;}
.day-tab:hover{color:var(--text);}
.day-tab.active{background:var(--yd);border-color:var(--yb);color:var(--y);}
.dp-section{font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--y);padding:14px 0 7px;border-bottom:1px solid rgba(240,180,41,0.1);margin-bottom:9px;text-transform:uppercase;}
.dp-block{margin-bottom:12px;background:var(--glass);border:1px solid var(--border);border-radius:9px;padding:11px 13px;}
.dp-block-head{display:flex;align-items:center;gap:7px;margin-bottom:7px;}
.dp-block-title{flex:1;font-size:13px;font-weight:700;color:var(--text);background:transparent;border:none;border-bottom:1px solid transparent;outline:none;font-family:inherit;transition:border-color .15s;padding:1px 0;}
.dp-block-title:focus{border-bottom-color:var(--t3);}
.dp-block-reorder{display:flex;gap:2px;flex-shrink:0;}
.dp-reorder-btn{background:var(--glass);border:1px solid var(--border);border-radius:5px;color:var(--t2);font-size:11px;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .12s;padding:0;}
.dp-reorder-btn:hover:not([disabled]){background:var(--yd);border-color:var(--yb);color:var(--y);}
.dp-reorder-btn[disabled]{opacity:.15;cursor:not-allowed;}
.dp-del-block{background:none;border:none;color:var(--t4);font-size:12px;cursor:pointer;padding:2px 5px;border-radius:4px;transition:color .12s;}
.dp-del-block:hover{color:var(--red);}
.dp-step-row{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.025);}
.dp-step-row:last-child{border-bottom:none;}
.dp-step-dash{color:var(--t3);font-size:11px;flex-shrink:0;}
.dp-step-input{flex:1;background:transparent;border:none;border-bottom:1px solid transparent;outline:none;font-family:inherit;font-size:12px;color:var(--text);padding:1.5px 0;transition:border-color .15s;}
.dp-step-input:focus{border-bottom-color:var(--t3);}
.dp-del-step{background:none;border:none;color:var(--t4);font-size:10px;cursor:pointer;padding:1px 3px;flex-shrink:0;transition:color .12s;}
.dp-del-step:hover{color:var(--red);}
.dp-add-step{background:none;border:1px dashed var(--t4);border-radius:6px;color:var(--t3);font-size:10px;padding:3px 8px;cursor:pointer;margin-top:7px;font-family:inherit;transition:all .12s;width:100%;}
.dp-add-step:hover{border-color:var(--y);color:var(--y);}
.dp-add-block{width:100%;padding:8px;background:transparent;border:1px dashed rgba(255,255,255,0.06);border-radius:9px;color:var(--t2);font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;margin-bottom:8px;transition:all .12s;}
.dp-add-block:hover{border-color:var(--y);color:var(--y);}
.dp-copy-btn{width:100%;padding:9px;background:var(--yd);border:1px solid var(--yb);border-radius:9px;color:var(--y);font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:.04em;transition:all .12s;margin-top:3px;}
.dp-copy-btn:hover{background:rgba(240,180,41,0.1);}
.dp-meal-block{background:var(--glass);border:1px solid var(--border);border-radius:9px;padding:11px 13px;margin:7px 0 3px;}
.dp-meal-head{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;color:var(--t2);margin-bottom:7px;}
.dp-meal-macros{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--t3);}
.dp-meal-num{width:48px;background:var(--glass);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;padding:3px 5px;text-align:center;outline:none;}
.dp-meal-num:focus{border-color:var(--y);}

/* MEALS */
.meal-day-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:13px;font-weight:800;font-size:14px;color:var(--text);}
.meal-day-totals{font-size:10px;color:var(--y);font-weight:700;letter-spacing:.04em;background:var(--yd);padding:3px 9px;border-radius:20px;border:1px solid var(--yb);}
.meal-card{background:var(--c1);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:8px;transition:border-color .12s;}
.meal-card:hover{border-color:var(--border2);}
.meal-card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.meal-card-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--t3);}
.meal-card-macros{font-size:10px;color:var(--y);display:flex;gap:6px;font-weight:700;}
.meal-card-macros span{background:var(--yd);padding:1.5px 7px;border-radius:20px;}
.meal-card-name{font-size:14px;font-weight:800;color:var(--text);margin-bottom:9px;}
.meal-card-items{margin:0;padding:0 0 0 13px;list-style:disc;}
.meal-card-items li{font-size:11.5px;color:var(--t1);margin-bottom:3px;line-height:1.5;}
.meals-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.meals-title{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--t3);}
.meal-row{background:var(--c1);border:1px solid var(--border);border-radius:11px;padding:12px 14px;margin-bottom:6px;transition:border-color .12s;}
.meal-row:hover{border-color:var(--border2);}
.meal-row-head{display:flex;align-items:center;gap:9px;}
.meal-row-emoji{font-size:16px;flex-shrink:0;}
.meal-row-info{flex:1;min-width:0;}
.meal-name-input{font-size:12.5px;font-weight:700;color:var(--text);background:transparent;border:none;outline:none;font-family:inherit;width:100%;padding:0;}
.meal-name-input::placeholder{color:var(--t3);}
.meal-desc-input{font-size:11px;color:var(--t2);background:transparent;border:none;outline:none;font-family:inherit;width:100%;padding:0;margin-top:2px;}
.meal-desc-input::placeholder{color:var(--t4);}
.meal-macros{display:flex;gap:4px;align-items:center;flex-shrink:0;}
.meal-macro-pill{background:var(--yd);border:1px solid var(--yb);border-radius:5px;padding:2px 7px;font-size:9.5px;font-weight:700;color:var(--y);cursor:pointer;transition:all .12s;}
.meal-macro-pill:hover{background:rgba(240,180,41,0.12);}
.meal-del-btn{background:none;border:none;color:var(--t4);font-size:11px;cursor:pointer;padding:2px 4px;border-radius:4px;transition:color .12s;}
.meal-del-btn:hover{color:var(--red);}
.meal-add-btn{width:100%;padding:9px;background:transparent;border:1px dashed rgba(255,255,255,0.06);border-radius:10px;color:var(--t2);font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;transition:all .12s;margin-top:3px;}
.meal-add-btn:hover{border-color:var(--y);color:var(--y);}
.macro-edit-popup{position:fixed;inset:0;z-index:997;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);backdrop-filter:blur(8px);}
.macro-edit-box{background:var(--c1);border:1px solid var(--border2);border-radius:15px;padding:22px;width:260px;}
.macro-edit-box-title{font-size:13px;font-weight:700;color:var(--text);margin-bottom:14px;}
.macro-edit-field{margin-bottom:10px;}
.macro-edit-field label{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);display:block;margin-bottom:5px;}
.macro-edit-field input{width:100%;background:var(--c2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:inherit;font-size:13px;padding:9px 11px;outline:none;transition:border-color .15s;}
.macro-edit-field input:focus{border-color:var(--yb);}
.macro-edit-actions{display:flex;gap:6px;margin-top:13px;}
.macro-edit-save{flex:1;padding:9px;background:linear-gradient(135deg,var(--y),var(--y3));border:none;border-radius:8px;color:#000;font-family:inherit;font-size:12px;font-weight:800;cursor:pointer;}
.macro-edit-cancel{padding:9px 13px;background:var(--glass);border:1px solid var(--border);border-radius:8px;color:var(--t2);font-family:inherit;font-size:12px;cursor:pointer;}

/* LOOKSMAX */
.lmg-wrap{background:var(--c1);border:1px solid var(--border);border-radius:13px;margin-bottom:11px;overflow:hidden;}
.lmg-header{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;cursor:pointer;transition:background .12s;}
.lmg-header:hover{background:var(--glass);}
.lmg-title{font-size:13px;font-weight:700;color:var(--text);}
.lmg-arrow{font-size:10px;color:var(--t3);transition:transform .2s;}
.lmg-arrow.open{transform:rotate(180deg);}
.lmg-body{padding:0 16px 14px;}
.lmg-item{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.03);}
.lmg-item:last-child{border-bottom:none;}
.lmg-check{width:18px;height:18px;border-radius:5px;border:1.5px solid rgba(255,255,255,0.1);flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .18s;}
.lmg-check.done{background:var(--y);border-color:var(--y);}
.lmg-check.done::after{content:'✓';font-size:9px;font-weight:900;color:#000;}
.lmg-item-body{flex:1;cursor:pointer;display:flex;align-items:center;gap:7px;}
.lmg-item-body:hover .lmg-item-text{color:var(--y);}
.lmg-item-text{font-size:12.5px;font-weight:600;color:var(--text);transition:color .12s;}
.lmg-item-text.done{color:var(--t2);text-decoration:line-through;}
.lmg-item-meta{font-size:9px;color:var(--t3);}
.lmg-del{background:none;border:none;color:var(--t4);font-size:11px;cursor:pointer;padding:2px 4px;border-radius:3px;transition:color .12s;}
.lmg-del:hover{color:var(--red);}
.lmg-add-btn{width:100%;padding:8px;background:transparent;border:1px dashed rgba(255,255,255,0.06);border-radius:8px;color:var(--t2);font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;transition:all .12s;margin-top:8px;}
.lmg-add-btn:hover{border-color:var(--y);color:var(--y);}

/* CHECKIN */
.checkin-section{margin-top:2px;}
.checkin-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.checkin-title{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--t3);}
.checkin-block{background:var(--c1);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:8px;}
.checkin-block-date{font-size:9px;font-weight:700;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;}
.checkin-block-del{background:none;border:none;color:var(--t4);font-size:11px;cursor:pointer;transition:color .12s;}
.checkin-block-del:hover{color:var(--red);}
.checkin-photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
.checkin-photo-slot{border-radius:9px;overflow:hidden;aspect-ratio:3/4;background:var(--glass);border:1px solid var(--border);position:relative;}
.checkin-photo-slot img{width:100%;height:100%;object-fit:cover;}
.checkin-photo-label{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.68);font-size:8px;color:#fff;text-align:center;padding:3px;letter-spacing:.04em;font-weight:700;}
.upload-slot{border-radius:9px;aspect-ratio:3/4;border:1.5px dashed rgba(255,255,255,0.08);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;background:rgba(255,255,255,0.01);position:relative;overflow:hidden;}
.upload-slot:hover{border-color:var(--y);background:var(--yd);}
.upload-slot.filled{border-color:var(--y);border-style:solid;}
.upload-slot img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;}
.upload-slot-label{font-size:8px;font-weight:700;color:var(--t3);text-align:center;padding:0 3px;letter-spacing:.04em;z-index:1;}
.upload-slot-icon{font-size:15px;margin-bottom:3px;z-index:1;}
.upload-slot.filled .upload-slot-label,.upload-slot.filled .upload-slot-icon{display:none;}
.upload-slot-remove{position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:rgba(0,0,0,0.85);border:none;color:#fff;font-size:8px;cursor:pointer;display:none;align-items:center;justify-content:center;z-index:2;}
.upload-slot.filled .upload-slot-remove{display:flex;}

/* EMPTY STATE */
.empty-state{text-align:center;padding:38px 18px;color:var(--t2);}
.empty-icon{font-size:26px;margin-bottom:9px;}
.empty-title{font-size:13.5px;font-weight:700;margin-bottom:5px;color:var(--text);}
.empty-sub{font-size:11.5px;line-height:1.6;}

/* SETTINGS */
.settings-group{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--border);}
.settings-group:last-child{border-bottom:none;}
.settings-label{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--t3);margin-bottom:7px;}
.settings-select,.settings-input{width:100%;background:var(--c2);border:1px solid var(--border);border-radius:9px;color:var(--text);font-family:inherit;font-size:13px;padding:10px 11px;outline:none;cursor:pointer;transition:border-color .15s;}
.settings-select:focus,.settings-input:focus{border-color:var(--yb);}
.settings-hint{font-size:10px;color:var(--t3);margin-top:4px;}
.settings-btn{background:var(--glass);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:inherit;font-size:12.5px;font-weight:600;padding:8px 14px;cursor:pointer;margin-right:7px;margin-top:4px;transition:all .12s;}
.settings-btn:hover{border-color:var(--border2);}
.settings-btn.danger{color:var(--red);border-color:rgba(255,61,107,0.18);}
.settings-btn.danger:hover{background:rgba(255,61,107,0.07);}

/* ONBOARDING */
.onboarding-overlay{position:fixed;inset:0;background:rgba(5,5,8,0.98);z-index:999;display:flex;align-items:flex-start;justify-content:center;backdrop-filter:blur(10px);overflow-y:auto;padding:44px 0;}
.onboarding-box{width:100%;max-width:500px;padding:0 22px 50px;}
.ob-wordmark{font-family:'Bebas Neue',sans-serif;letter-spacing:4px;font-size:11px;color:var(--t3);margin-bottom:7px;}
.ob-title{font-family:'Bebas Neue',sans-serif;font-size:44px;letter-spacing:2px;line-height:1;margin-bottom:5px;}
.ob-sub{font-size:12.5px;color:var(--t2);font-weight:300;margin-bottom:34px;}
.ob-progress{width:100%;height:1px;background:var(--border);margin-bottom:38px;}
.ob-progress-fill{height:1px;background:linear-gradient(90deg,var(--y),var(--y2));transition:width .4s cubic-bezier(.4,0,.2,1);}
.ob-step-label{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--t3);margin-bottom:9px;}
.ob-q{font-family:'Bebas Neue',sans-serif;font-size:34px;letter-spacing:1.5px;margin-bottom:5px;}
.ob-q-sub{font-size:12.5px;color:var(--t2);font-weight:300;margin-bottom:22px;}
.ob-options{display:flex;flex-direction:column;gap:7px;margin-bottom:28px;}
.ob-opt{background:transparent;border:1px solid var(--border);border-radius:11px;padding:12px 15px;color:var(--t2);font-family:inherit;font-size:13px;font-weight:500;text-align:left;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:9px;}
.ob-opt:hover{border-color:var(--border2);color:var(--text);background:var(--glass);}
.ob-opt.selected{border-color:var(--y);color:var(--text);background:var(--yd);}
.ob-opt.selected::after{content:'';width:5px;height:5px;border-radius:50%;background:var(--y);margin-left:auto;}
.ob-input-wrap{margin-bottom:28px;}
.ob-text-input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--t4);color:var(--text);font-family:'Bebas Neue',sans-serif;font-size:40px;padding:7px 0;outline:none;transition:border-color .2s;}
.ob-text-input:focus{border-bottom-color:var(--t2);}
.ob-text-input::placeholder{color:var(--t4);}
.ob-text-unit{font-size:12px;color:var(--t3);margin-top:5px;}
.ob-nav{display:flex;align-items:center;justify-content:space-between;}
.ob-back{background:none;border:none;color:var(--t3);font-family:inherit;font-size:12.5px;cursor:pointer;padding:0;transition:color .12s;}
.ob-back:hover{color:var(--t2);}
.ob-next{background:linear-gradient(135deg,var(--y),var(--y3));border:none;border-radius:9px;padding:11px 26px;color:#000;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;letter-spacing:.03em;transition:all .12s;}
.ob-next:hover{opacity:.88;transform:translateY(-1px);}
.ob-next:disabled{background:var(--c2);color:var(--t3);cursor:not-allowed;transform:none;}
.ob-step-counter{font-size:11.5px;color:var(--t3);letter-spacing:.06em;}
.ob-complete{text-align:center;padding:18px 0;}
.ob-complete-icon{font-size:38px;margin-bottom:14px;}
.ob-complete-title{font-family:'Bebas Neue',sans-serif;font-size:50px;letter-spacing:3px;color:var(--y);margin-bottom:7px;}
.ob-complete-sub{font-size:12.5px;color:var(--t2);line-height:1.7;margin-bottom:26px;}
.ob-summary{text-align:left;border-top:1px solid var(--border);padding-top:18px;margin-bottom:26px;}
.ob-summary-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.025);font-size:12.5px;}
.ob-summary-lbl{color:var(--t2);}
.ob-summary-val{color:var(--text);font-weight:700;}
.ob-launch{width:100%;padding:13px;background:linear-gradient(135deg,var(--y),var(--y3));border:none;border-radius:11px;color:#000;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer;letter-spacing:.03em;transition:all .12s;}
.ob-launch:hover{opacity:.88;transform:translateY(-1px);}
.ob-generating{text-align:center;padding:38px 0;}
.ob-gen-spinner{width:44px;height:44px;border:2.5px solid var(--border);border-top-color:var(--y);border-radius:50%;animation:spin .75s linear infinite;margin:0 auto 18px;}
@keyframes spin{to{transform:rotate(360deg)}}
.ob-gen-title{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:2px;color:var(--y);margin-bottom:7px;}
.ob-gen-sub{font-size:12.5px;color:var(--t2);line-height:1.7;}
.ob-photo-instructions{margin-bottom:14px;}
.ob-photo-req{font-size:11.5px;font-weight:700;color:var(--t2);margin-bottom:7px;letter-spacing:.03em;}
.ob-photo-req-list{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
.ob-photo-req-list span{font-size:11.5px;color:var(--t3);background:var(--c2);border:1px solid var(--border);border-radius:7px;padding:5px 9px;}
.ob-upload-zone{border:1.5px dashed rgba(255,255,255,0.09);border-radius:11px;padding:26px;text-align:center;cursor:pointer;transition:all .18s;background:rgba(255,255,255,0.01);margin-bottom:12px;}
.ob-upload-zone:hover{border-color:var(--y);background:var(--yd);}
.ob-upload-icon{font-size:26px;margin-bottom:7px;}
.ob-upload-text{font-size:13px;font-weight:700;color:var(--text);margin-bottom:3px;}
.ob-upload-sub{font-size:11.5px;color:var(--t3);}
.ob-photo-preview-row{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:7px;}
.ob-preview-item{position:relative;border-radius:8px;overflow:hidden;aspect-ratio:3/4;background:var(--c2);}
.ob-preview-item img{width:100%;height:100%;object-fit:cover;}
.ob-preview-remove{position:absolute;top:3px;right:3px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.85);border:none;color:#fff;font-size:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;}
.ob-preview-label{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.68);font-size:8px;color:#fff;text-align:center;padding:3px;letter-spacing:.03em;}

/* MOBILE */
.bottom-nav{display:none;}
@media(max-width:600px){
  html,body{overflow:hidden;height:100dvh;}
  .app-body{flex-direction:column-reverse;}
  .sidebar{display:flex!important;position:fixed;left:-205px;top:0;bottom:0;z-index:200;width:205px;transition:left .25s cubic-bezier(.4,0,.2,1);}
  .sidebar.open{left:0;box-shadow:6px 0 30px rgba(0,0,0,0.6);}
  .sidebar-backdrop.open{display:block;}
  .main{flex:1;overflow:hidden;display:flex;flex-direction:column;}
  .main-content{flex:1;overflow-y:auto;padding:12px 12px 68px;}
  .topbar{padding:0 10px;height:48px;gap:4px;}
  .hamburger{display:flex;}
  .topbar-logo-text{font-size:15px;}
  .tb-badge{padding:4px 8px;font-size:10.5px;}
  .topbar-avatar{width:28px;height:28px;font-size:10px;}
  .notif-dropdown{right:0;width:270px;}
  .avatar-dropdown{right:0;}
  .bottom-nav{display:flex;position:fixed;bottom:0;left:0;right:0;height:56px;background:rgba(5,5,8,0.97);border-top:1px solid var(--border);backdrop-filter:blur(24px);z-index:100;padding-bottom:env(safe-area-inset-bottom);}
  .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);font-size:8px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;transition:color .12s;border:none;background:none;font-family:inherit;}
  .bottom-nav-item svg{width:18px;height:18px;stroke-width:1.8;flex-shrink:0;}
  .bottom-nav-item.active{color:var(--y);}
  .exercise-weight-label{display:none;}
  .exercise-weight-input{width:40px;font-size:15px;}
}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
.ai-thinking span{width:5px;height:5px;border-radius:50%;background:var(--t2);animation:bounce .9s infinite;display:inline-block;margin:0 2px;}
.ai-thinking span:nth-child(2){animation-delay:.15s;}
.ai-thinking span:nth-child(3){animation-delay:.3s;}
.streak-badge{display:inline-flex;align-items:center;gap:5px;}
.progress-photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px;}
.progress-photo-item{border-radius:9px;overflow:hidden;aspect-ratio:3/4;background:var(--c2);}
.progress-photo-item img{width:100%;height:100%;object-fit:cover;}
.progress-checkin{background:var(--c2);border:1px solid var(--border);border-radius:11px;padding:12px;margin-bottom:8px;}
.progress-checkin-date{font-size:9px;color:var(--t3);letter-spacing:.09em;text-transform:uppercase;margin-bottom:8px;font-weight:700;}
.nutrition-header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:nowrap;}
`;

// Replace the style block
html = html.replace(/<style>[\s\S]*?<\/style>/, '<style>\n' + NEW_CSS + '\n</style>');

// Update CSS vars references in HTML that use old var names
html = html.replace(/var\(--bg-card\)/g, 'var(--c1)');
html = html.replace(/var\(--bg-panel\)/g, 'var(--c2)');
html = html.replace(/var\(--bg-sb\)/g, 'var(--sb)');
html = html.replace(/var\(--bg-input\)/g, 'var(--c2)');
html = html.replace(/var\(--t1\)/g, 'var(--text)');

// Fix duplicate DOCTYPE if present
html = html.replace(/<!DOCTYPE html>\s*<html[^>]*>\s*<head>[\s\S]*?<title>[^<]*<\/title>\s*(<!DOCTYPE html>)/, '$1');

// Remove double head block if present 
const firstStyle = html.indexOf('<style>');
const firstDoctype = html.indexOf('<!DOCTYPE html>');
if(firstDoctype > 0) {
  // There's a second doctype - remove the first head block
  html = html.substring(firstDoctype);
}

fs.writeFileSync('app.html', html);
console.log('Done');
