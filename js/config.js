// ── MODEL CONFIG ──
const MODEL_CFG = {
  'veo3-lite':{credits:15,durations:[8],defaultDur:8,aspects:[{v:'9:16',l:'9:16 Portrait'},{v:'16:9',l:'16:9 Landscape'}],defaultAsp:'9:16'},
  'sora2':{credits:20,durations:[10,15],defaultDur:15,aspects:[{v:'9:16',l:'9:16 Portrait'},{v:'16:9',l:'16:9 Landscape'}],defaultAsp:'9:16'},
  'sora2-12s':{credits:25,durations:[12],defaultDur:12,aspects:[{v:'9:16',l:'9:16 Portrait'},{v:'16:9',l:'16:9 Landscape'}],defaultAsp:'9:16'},
  'grok':{credits:15,durations:[6],defaultDur:6,aspects:[{v:'9:16',l:'9:16 Portrait'},{v:'16:9',l:'16:9 Landscape'},{v:'1:1',l:'1:1 Square'}],defaultAsp:'9:16',qualities:[{v:'720p',l:'720p'},{v:'480p',l:'480p'}],defaultQ:'720p',creditsByQ:{'720p':15,'480p':10}},
};
const IMG_CFG = {
  'nano-banana-pro':{credits:15},
  'nano-banana-2':{credits:10},
};

// ── STATE ──
let creds = 0;
let currentUser = null;
const SUPABASE_URL = 'https://asvpzsnncbxkpycsgfnj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdnB6c25uY2J4a3B5Y3NnZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTMwOTksImV4cCI6MjA5MTM2OTA5OX0.S1poy30uv9R6_xG8d-wi27eIgeXbvlVIaLbgAljM4j0';
let selImg=null, selRefImg=null, selVoiceId=null, selVoiceName=null, pipeVoiceId=null, modalAudioFile=null;
let lastScrape=[];
let promptCtx=null;
let pipeSilFile=null;
let pipe = {
  step:0, unlocked:new Set([0]),
  channelFiles:[], selectedIdea:null, ideas:[], script:'', scenes:[],
  refImageFile:null, voiceUrl:null, silencedUrl:null,
};

function updCreds(){
  const tb=document.getElementById('topUpBalance');if(tb)tb.textContent=creds;
  document.getElementById('creditsDisplay').textContent=creds;
  localStorage.setItem('viralmax_credits', creds);
}
function openTopUp(){
  document.getElementById('topUpBalance').textContent=creds;
  document.getElementById('topUpModal').style.display='flex';
}
function closeTopUp(e){if(e.target===document.getElementById('topUpModal'))document.getElementById('topUpModal').style.display='none';}
async function buyCredits(amount, price){
  // TODO: wire to Stripe checkout
  if (!currentUser) { window.location.href = '/login'; return; }
  const endpoint = [1200,3500,7500].includes(amount) ? '/api/checkout/topup' : '/api/checkout/plan';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id, 'x-user-email': currentUser.email, 'origin': window.location.origin },
      body: JSON.stringify({ amount, plan: [1200,3500,7500].includes(amount) ? undefined : 'pro' })
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert('Checkout error: ' + (data.error || 'unknown'));
  } catch(e) { alert('Checkout failed: ' + e.message); }
  document.getElementById('topUpModal').style.display='none';
}

async function requireCredits(amount) {
  if (!currentUser) { window.location.href = '/login'; return false; }
  if (creds < amount) {
    if (confirm('Not enough credits. You need ' + amount + ' credits but have ' + creds + '.\n\nClick OK to top up.')) {
      openTopUp();
    }
    return false;
  }
  // Deduct from server
  try {
    const res = await fetch('/api/credits/deduct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (!data.ok) {
      if (data.error === 'Not enough credits') {
        if (confirm('Not enough credits.\n\nClick OK to top up.')) openTopUp();
        return false;
      }
      throw new Error(data.error);
    }
    creds = data.credits;
    if(currentUser) localStorage.setItem('vm_credits_' + currentUser.id, creds);
    localStorage.setItem('vm_credits_last', creds);
    updCreds();
    return true;
  } catch(e) {
    alert('Credit check failed: ' + e.message);
    return false;
  }
}

async function openPortal() {
  if (!currentUser) { window.location.href = '/login'; return; }
  try {
    const res = await fetch('/api/portal', {
      method: 'POST',
      headers: { 'x-user-id': currentUser.id, 'origin': window.location.origin }
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert('Error: ' + (data.error || 'Could not open billing portal'));
  } catch(e) { alert('Failed to open portal: ' + e.message); }
}
