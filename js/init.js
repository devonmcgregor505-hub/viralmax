// ── INIT ──
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

  // Fetch real credits from server
  try {
    const res = await fetch('/api/credits', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    creds = data.credits ?? 0;
  } catch(e) {
    creds = 0;
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

  // Handle post-payment redirect
  const params = new URLSearchParams(window.location.search);
  if (params.get('upgraded') || params.get('topup')) {
    setTimeout(() => {
      alert('✅ Payment successful! Your credits have been added.');
      window.history.replaceState({}, '', '/app');
    }, 500);
  }
})();
