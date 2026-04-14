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
  // Populate dropdowns immediately
  try { onModelChange(); } catch(e) {}
  try { onImgModelChange(); } catch(e) {}
  try { renderVoiceSel(); } catch(e) {}
  // Switch to vidgen immediately so UI looks correct before auth completes
  try { switchTab('vidgen'); } catch(e) {}
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
