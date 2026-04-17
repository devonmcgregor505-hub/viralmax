// ── INIT ──
// Initialise UI instantly on DOMContentLoaded - no async needed
document.addEventListener('DOMContentLoaded', function() {
  // Show cached credits
  try {
    const lastKnown = localStorage.getItem('vm_credits_last');
    if (lastKnown !== null) {
      const cached = parseInt(lastKnown);
      if (!isNaN(cached)) {
        creds = cached;
        const el = document.getElementById('creditsDisplay');
        if (el) el.textContent = cached;
      }
    }
  } catch(e) {}
  // Restore saved settings from localStorage
  try {
    const vm = localStorage.getItem('vm_vidModel');
    if (vm) { const el = document.getElementById('vidModel'); if(el) el.value = vm; }
  } catch(e) {}
  try {
    const im = localStorage.getItem('vm_imgModel');
    if (im) { const el = document.getElementById('imgModel'); if(el) el.value = im; }
  } catch(e) {}
  try {
    const ytc = localStorage.getItem('vm_ytCount');
    if (ytc) { const el = document.getElementById('ytCount'); if(el) el.value = ytc; }
    const yts = localStorage.getItem('vm_ytSort');
    if (yts) { const el = document.getElementById('ytSort'); if(el) el.value = yts; }
    const ytu = localStorage.getItem('vm_ytUrl');
    if (ytu) { const el = document.getElementById('ytUrl'); if(el) el.value = ytu; }
  } catch(e) {}
  try {
    const db = localStorage.getItem('vm_dbSlider');
    if (db) {
      const el = document.getElementById('dbSlider');
      if(el) { el.value = db; document.getElementById('dbVal').textContent = db + ' dB'; }
    }
  } catch(e) {}
  try {
    const exag = localStorage.getItem('vm_exag');
    if (exag) {
      const el = document.getElementById('exagSlider');
      if(el) { el.value = exag; document.getElementById('exagVal').textContent = exag; }
    }
  } catch(e) {}

  // Restore last tab FIRST before anything else
  try {
    const validTabs = ['vidgen','imggen','voicegen','deadspace','scraper'];
    const lastTab = localStorage.getItem('vm_lastTab') || 'vidgen';
    switchTab(validTabs.includes(lastTab) ? lastTab : 'vidgen');
  } catch(e) { try { switchTab('vidgen'); } catch(e2) {} }
  // Populate dropdowns immediately (uses restored model value)
  try { onModelChange(); } catch(e) {}
  try { onImgModelChange(); } catch(e) {}
  try { renderVoiceSel(); } catch(e) {}

  // Restore vid dur/asp/qual after onModelChange populates them
  try {
    const vd = localStorage.getItem('vm_vidDur');
    const va = localStorage.getItem('vm_vidAsp');
    const vq = localStorage.getItem('vm_vidQual');
    setTimeout(() => {
      if (vd) { const el = document.getElementById('vidDur'); if(el) el.value = vd; }
      if (va) { const el = document.getElementById('vidAsp'); if(el) el.value = va; }
      if (vq) { const el = document.getElementById('vidQual'); if(el) el.value = vq; onQualityChange(); }
    }, 50);
  } catch(e) {}
});

// Define logout immediately, before any async code
async function logout() {
  if (window._sb) {
    await window._sb.auth.signOut();
  }
  window.location.href = '/login';
}

(async function() {
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  window._sb = sb;

  // Check session
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = '/login';
    return;
  }

  currentUser = session.user;

  // Show user info in top nav
  const email = currentUser.email || '';
  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = email;
  const emailShort = document.getElementById('userEmailShort');
  if (emailShort) emailShort.textContent = email.split('@')[0];
  const emailFull = document.getElementById('userEmailFull');
  if (emailFull) emailFull.textContent = email;
  const avatarEl = document.getElementById('userAvatarInitial');
  if (avatarEl) avatarEl.textContent = email.charAt(0).toUpperCase();
  // Topbar avatar letter + dropdown email
  const topLetter = document.getElementById('topbarAvatarLetter');
  if (topLetter) topLetter.textContent = email.charAt(0).toUpperCase();
  const topEmail = document.getElementById('topbarEmailFull');
  if (topEmail) topEmail.textContent = email;
  // Sidebar user info
  const sideAv = document.getElementById('userAvatarSidebar');
  if (sideAv) sideAv.textContent = email.charAt(0).toUpperCase();
  const sideName = document.getElementById('userEmailSidebar');
  if (sideName) sideName.textContent = email.split('@')[0];

  // Show cached credits instantly, then fetch real value
  const cachedCreds = localStorage.getItem('vm_credits_' + currentUser.id);
  if (cachedCreds !== null) { creds = parseInt(cachedCreds); updCreds(); }

  try {
    const res = await fetch('/api/credits', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    creds = data.credits ?? 0;
    localStorage.setItem('vm_credits_' + currentUser.id, creds);
    localStorage.setItem('vm_credits_last', creds);
    if (data.plan) {
      localStorage.setItem('vm_plan_' + currentUser.id, data.plan);
      localStorage.setItem('vm_plan_last', data.plan);
    }
  } catch(e) {
    creds = cachedCreds ? parseInt(cachedCreds) : 0;
  }

  // Init UI
  renderCustomVoicesList();
  onModelChange();
  updCreds();
  onImgModelChange();
  renderVoiceSel();
  renderVoiceOutputs();

  // Handle hash routing
  const hash = window.location.hash.replace('#','');
  if (hash && document.getElementById('tab-'+hash)) switchTab(hash);
  else { const _lt = localStorage.getItem('vm_lastTab'); const _vt = ['vidgen','imggen','voicegen','deadspace','scraper']; switchTab(_vt.includes(_lt) ? _lt : 'vidgen'); }

  // Refresh credits from server every 30 seconds
  setInterval(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/credits', { headers: { 'x-user-id': currentUser.id } });
      const data = await res.json();
      if (data.credits !== undefined) { creds = data.credits; updCreds(); }
    } catch(e) {}
  }, 30000);

  // Handle post-payment redirect
  const params = new URLSearchParams(window.location.search);
  if (params.get('upgraded') || params.get('topup')) {
    setTimeout(() => {
      alert('✅ Payment successful! Your credits have been added.');
      window.history.replaceState({}, '', '/app');
    }, 500);
  }
})();
