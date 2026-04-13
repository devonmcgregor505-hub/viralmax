// ── INIT ──
(async function() {
  // Load Supabase
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

  // Check session
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    window.location.href = '/login';
    return;
  }

  currentUser = session.user;

  // Show user email in UI
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

  // Logout handler
  window.logout = async function() {
    await sb.auth.signOut();
    window.location.href = '/login';
  };

  // Store sb globally for credit deduction
  window._sb = sb;
})();
