// ── MODEL CONFIG ──
const MODEL_CFG = {
  'veo3-lite':{credits:15,durations:[8],defaultDur:8,aspects:[{v:'9:16',l:'9:16 Portrait'},{v:'16:9',l:'16:9 Landscape'}],defaultAsp:'9:16'},
  'sora2':{credits:20,durations:[10,15],defaultDur:15,aspects:[{v:'9:16',l:'9:16 Portrait'},{v:'16:9',l:'16:9 Landscape'}],defaultAsp:'9:16'},
  'grok':{credits:15,durations:[6],defaultDur:6,aspects:[{v:'9:16',l:'9:16 Portrait'},{v:'16:9',l:'16:9 Landscape'},{v:'1:1',l:'1:1 Square'}],defaultAsp:'9:16',qualities:[{v:'720p',l:'720p'},{v:'480p',l:'480p'}],defaultQ:'720p',creditsByQ:{'720p':15,'480p':10}},
};
const IMG_CFG = {
  'nano-banana-pro':{credits:15},
  'nano-banana-2':{credits:10},
};

// ── STATE ──
let creds = 500;
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
  document.getElementById('creditsDisplay').textContent=creds;
  localStorage.setItem('viralmax_credits', creds);
}
function openTopUp(){
  document.getElementById('topUpBalance').textContent=creds;
  document.getElementById('topUpModal').style.display='flex';
}
function closeTopUp(e){if(e.target===document.getElementById('topUpModal'))document.getElementById('topUpModal').style.display='none';}
function buyCredits(amount, price){
  // TODO: wire to Stripe checkout
  alert('Stripe checkout coming soon!\nYou selected: ' + amount + ' credits for $' + price);
  document.getElementById('topUpModal').style.display='none';
}
