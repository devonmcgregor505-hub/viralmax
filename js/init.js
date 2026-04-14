// ── INIT ──
// Show cached credits IMMEDIATELY before any async code runs
(function() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('vm_credits_'));
    if (keys.length > 0) {
      const cached = parseInt(localStorage.getItem(keys[0]));
      if (!isNaN(cached)) {
        creds = cached;
        const el = document.getElementById('creditsDisplay');
        if (el) el.textContent = cached;
      }
    }
  } catch(e) {}
})();

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

  // Show user email
  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = currentUser.email;

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
  else switchTab('vidgen');

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
