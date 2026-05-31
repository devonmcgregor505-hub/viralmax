const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');

// Check if already partially applied and clean up
html = html.replace(/\/\/ ─── NOTIFICATIONS ───[\s\S]*?setInterval\(checkScheduledNotifs, 3600000\);\s*\}\)\(\);/g, '');

// ─── 1. Only add notif button HTML if not already there ───
if(!html.includes('notifWrap')){
  html = html.replace(
    `    <div class="avatar-wrap">`,
    `    <div class="notif-wrap" id="notifWrap">
      <div class="notif-btn" id="notifBtn" onclick="toggleNotifs()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        <span class="notif-badge" id="notifBadge" style="display:none">0</span>
      </div>
      <div class="notif-dropdown" id="notifDropdown">
        <div class="notif-header">
          <span class="notif-title">Notifications</span>
          <button class="notif-clear-all" onclick="clearAllNotifs()">Clear all</button>
        </div>
        <div class="notif-list" id="notifList"></div>
      </div>
    </div>
    <div class="avatar-wrap">`
  );
}

// ─── 2. Only add CSS if not already there ───
if(!html.includes('.notif-wrap')){
  html = html.replace(
    `.avatar-wrap{position:relative;}`,
    `.notif-wrap{position:relative;}
.notif-btn{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:var(--t2);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;position:relative;}
.notif-btn:hover{background:rgba(255,255,255,0.09);color:var(--text);}
.notif-btn.has-notifs{color:var(--text);border-color:rgba(255,200,0,0.2);background:rgba(255,200,0,0.07);}
.notif-badge{position:absolute;top:-5px;right:-5px;background:var(--y);color:#000;font-size:10px;font-weight:900;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;line-height:1;border:2px solid var(--bg);}
.notif-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:var(--bg-card);border:1px solid rgba(255,255,255,0.09);border-radius:14px;width:300px;z-index:999;display:none;box-shadow:0 16px 48px rgba(0,0,0,0.55);overflow:hidden;}
.notif-dropdown.open{display:block;}
.notif-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid var(--border);}
.notif-title{font-size:13px;font-weight:800;color:var(--text);letter-spacing:.03em;}
.notif-clear-all{background:none;border:none;color:var(--t3);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:color .15s;}
.notif-clear-all:hover{color:var(--t2);}
.notif-list{max-height:320px;overflow-y:auto;}
.notif-item{display:flex;gap:12px;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background .15s;position:relative;}
.notif-item:last-child{border-bottom:none;}
.notif-item:hover{background:rgba(255,255,255,0.03);}
.notif-item.unread::before{content:'';position:absolute;left:6px;top:50%;transform:translateY(-50%);width:5px;height:5px;border-radius:50%;background:var(--y);}
.notif-icon{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;margin-top:1px;}
.notif-icon-photo{background:rgba(255,200,0,0.1);}
.notif-body{flex:1;min-width:0;}
.notif-msg{font-size:13px;font-weight:600;color:var(--text);line-height:1.4;margin-bottom:3px;}
.notif-time{font-size:11px;color:var(--t3);}
.notif-dismiss{background:none;border:none;color:var(--t4);font-size:12px;cursor:pointer;padding:2px 4px;border-radius:4px;transition:color .15s;flex-shrink:0;align-self:flex-start;margin-top:1px;}
.notif-dismiss:hover{color:var(--red);}
.notif-empty{padding:32px 16px;text-align:center;color:var(--t3);font-size:13px;}
.avatar-wrap{position:relative;}`
  );
}

// ─── 3. JS — inject before </script> ───
const NOTIF_JS = `
// NOTIFICATIONS
const NOTIF_KEY = 'ascend_notifications';
const NOTIF_SEEN_KEY = 'ascend_notif_seen';
function getNotifs(){ return JSON.parse(localStorage.getItem(NOTIF_KEY)||'[]'); }
function saveNotifs(arr){ localStorage.setItem(NOTIF_KEY, JSON.stringify(arr)); }
function addNotif(msg, icon, iconClass){
  const notifs = getNotifs();
  notifs.unshift({id:Date.now(), msg, icon:icon||'bell', iconClass:iconClass||'', time:new Date().toISOString(), read:false});
  saveNotifs(notifs);
  renderNotifBadge();
}
function dismissNotif(id){
  saveNotifs(getNotifs().filter(function(n){return n.id!==id;}));
  renderNotifBadge(); renderNotifList();
}
function clearAllNotifs(){ saveNotifs([]); renderNotifBadge(); renderNotifList(); }
function markAllRead(){
  saveNotifs(getNotifs().map(function(n){return Object.assign({},n,{read:true});}));
  renderNotifBadge();
}
function renderNotifBadge(){
  var unread = getNotifs().filter(function(n){return !n.read;}).length;
  var badge = document.getElementById('notifBadge');
  var btn = document.getElementById('notifBtn');
  if(!badge||!btn) return;
  if(unread > 0){
    badge.style.display = 'flex';
    badge.textContent = unread > 9 ? '9+' : unread;
    btn.classList.add('has-notifs');
  } else {
    badge.style.display = 'none';
    btn.classList.remove('has-notifs');
  }
}
function renderNotifList(){
  var list = document.getElementById('notifList');
  if(!list) return;
  var notifs = getNotifs();
  if(notifs.length === 0){ list.innerHTML = '<div class="notif-empty">You\'re all caught up \u2713</div>'; return; }
  list.innerHTML = notifs.map(function(n){
    var d = new Date(n.time);
    var diffMs = Date.now() - d;
    var diffMins = Math.floor(diffMs/60000);
    var diffHrs = Math.floor(diffMs/3600000);
    var diffDays = Math.floor(diffMs/86400000);
    var t = diffMins<1?'Just now':diffMins<60?diffMins+'m ago':diffHrs<24?diffHrs+'h ago':diffDays===1?'Yesterday':d.toLocaleDateString('en-NZ',{day:'numeric',month:'short'});
    return '<div class="notif-item'+(n.read?'':' unread')+'">'
      +'<div class="notif-icon '+n.iconClass+'">'+n.icon+'</div>'
      +'<div class="notif-body"><div class="notif-msg">'+n.msg+'</div><div class="notif-time">'+t+'</div></div>'
      +'<button class="notif-dismiss" onclick="dismissNotif('+n.id+')">&#x2715;</button>'
      +'</div>';
  }).join('');
}
function toggleNotifs(){
  var dd = document.getElementById('notifDropdown');
  if(!dd) return;
  var isOpen = dd.classList.contains('open');
  document.getElementById('avatarDropdown') && document.getElementById('avatarDropdown').classList.remove('open');
  if(isOpen){ dd.classList.remove('open'); }
  else { dd.classList.add('open'); renderNotifList(); markAllRead(); }
}
document.addEventListener('click', function(e){
  var wrap = document.getElementById('notifWrap');
  if(wrap && !wrap.contains(e.target)) document.getElementById('notifDropdown') && document.getElementById('notifDropdown').classList.remove('open');
});
function getWeekNumber(d){
  var date = new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
  date.setUTCDate(date.getUTCDate()+4-(date.getUTCDay()||7));
  var yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date-yearStart)/86400000)+1)/7);
}
function checkScheduledNotifs(){
  var now = new Date();
  var seen = JSON.parse(localStorage.getItem(NOTIF_SEEN_KEY)||'{}');
  var weekKey = 'photo_'+now.getFullYear()+'_'+getWeekNumber(now);
  if(now.getDay()===5 && !seen[weekKey]){
    addNotif('Time to add your weekly progress photos \u2014 keep the streak going.', '\uD83D\uDCF8', 'notif-icon-photo');
    seen[weekKey]=true;
    localStorage.setItem(NOTIF_SEEN_KEY, JSON.stringify(seen));
  }
}
(function initNotifs(){
  checkScheduledNotifs();
  renderNotifBadge();
  setInterval(checkScheduledNotifs, 3600000);
})();
`;

html = html.replace('</script>', NOTIF_JS + '\n</script>');

var count = (html.match(/\/\/ NOTIFICATIONS/g)||[]).length;
if(count !== 1){ console.error('FAIL: JS injected '+count+' times'); process.exit(1); }
if(!html.includes('notifWrap')){ console.error('FAIL: HTML missing'); process.exit(1); }
fs.writeFileSync('app.html', html);
console.log('Patch applied cleanly');
