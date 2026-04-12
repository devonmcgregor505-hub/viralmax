// ── INIT ──
creds = parseInt(localStorage.getItem('viralmax_credits')) || 500;
renderCustomVoicesList();
renderCustomVoicesList();
onModelChange();updCreds();onImgModelChange();renderVoiceSel();renderVoiceOutputs();


// Handle hash routing from homepage
const hash=window.location.hash.replace('#','');
if(hash&&document.getElementById('tab-'+hash))switchTab(hash);
