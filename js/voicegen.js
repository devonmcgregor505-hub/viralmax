// ── VOICE GEN ──
function loadVoices(){try{return JSON.parse(localStorage.getItem('viralmax_voices')||'[]')}catch{return[]}}
function saveVoices(v){localStorage.setItem('viralmax_voices',JSON.stringify(v))}

function renderVoiceSel(){
  restoreVoicePrefs();
  const sel=document.getElementById('cloneVoiceSel');const voices=loadVoices();
  sel.innerHTML=voices.length?'':'<option value="">No voices added</option>';
  voices.forEach(v=>{const o=document.createElement('option');o.value=v.id;o.textContent=v.name;sel.appendChild(o)});
  sel.value=selVoiceId||'';updateDelBtn();
}
function onVoiceChange(){selVoiceId=document.getElementById('voiceSel').value;const v=loadVoices().find(x=>x.id===selVoiceId);selVoiceName=v?v.name:'Voice';updateDelBtn()}
function updateDelBtn(){document.getElementById('delVoiceBtn').style.display=selVoiceId?'block':'none'}
function deleteVoice(){if(!confirm('Delete "'+selVoiceName+'"?'))return;saveVoices(loadVoices().filter(v=>v.id!==selVoiceId));selVoiceId=null;selVoiceName=null;renderVoiceSel()}

let modalAudioFile2=null;
function openAddVoiceModal(){modalAudioFile2=null;document.getElementById('modalAudioFnm').textContent='';document.getElementById('modalVoiceName').value='';document.getElementById('modalAudioDrop').classList.remove('has');document.getElementById('addVoiceModal').style.display='flex'}
function closeAddVoiceModal(){document.getElementById('addVoiceModal').style.display='none'}
document.getElementById('modalAudioDrop').addEventListener('dragover',e=>{e.preventDefault();document.getElementById('modalAudioDrop').classList.add('drag')});
document.getElementById('modalAudioDrop').addEventListener('dragleave',()=>document.getElementById('modalAudioDrop').classList.remove('drag'));
document.getElementById('modalAudioDrop').addEventListener('drop',e=>{e.preventDefault();document.getElementById('modalAudioDrop').classList.remove('drag');if(e.dataTransfer.files[0])loadModalAudio(e.dataTransfer.files[0])});
document.getElementById('modalAudioInp').addEventListener('change',()=>{if(document.getElementById('modalAudioInp').files[0])loadModalAudio(document.getElementById('modalAudioInp').files[0])});
function loadModalAudio(f){modalAudioFile2=f;document.getElementById('modalAudioFnm').textContent='📎 '+f.name;document.getElementById('modalAudioDrop').classList.add('has')}
function saveVoice(){
  const name=document.getElementById('modalVoiceName').value.trim();if(!name){alert('Enter a name');return}if(!modalAudioFile2){alert('Upload a voice sample');return}
  const reader=new FileReader();reader.onload=()=>{
    const b64=reader.result.split(',')[1];const voices=loadVoices();const id='voice_'+Date.now();
    voices.push({id,name,audioB64:b64,mimeType:modalAudioFile2.type});saveVoices(voices);closeAddVoiceModal();renderVoiceSel();renderPipeVoiceSel();
    selVoiceId=id;selVoiceName=name;document.getElementById('voiceSel').value=id;updateDelBtn();
  };reader.readAsDataURL(modalAudioFile2);
}

// ── VOICE MODE ──
let currentVoiceMode = 'voice';

function setVoiceMode(mode) {
  currentVoiceMode = mode;
  document.getElementById('voiceModePanel').style.display = mode === 'voice' ? 'flex' : 'none';
  document.getElementById('cloneModePanel').style.display = mode === 'clone' ? 'flex' : 'none';
  document.getElementById('voiceModePanel').style.flexDirection = 'column';
  document.getElementById('voiceModePanel').style.gap = '12px';
  document.getElementById('cloneModePanel').style.flexDirection = 'column';
  document.getElementById('cloneModePanel').style.gap = '12px';
  document.getElementById('modeVoiceBtn').style.background = mode === 'voice' ? 'var(--y)' : 'transparent';
  document.getElementById('modeVoiceBtn').style.color = mode === 'voice' ? '#000' : 'var(--t2)';
  document.getElementById('modeCloneBtn').style.background = mode === 'clone' ? 'var(--y)' : 'transparent';
  document.getElementById('modeCloneBtn').style.color = mode === 'clone' ? '#000' : 'var(--t2)';
}


// ── VOICE PICKER DATA ──
const ALL_VOICES = [
  {id:'21m00Tcm4TlvDq8ikWAM',name:'Rachel',gender:'female',accent:'american',age:'young',desc:'Calm and composed narrator',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/high.mp3'},
  {id:'AZnzlk1XvdvUeBnXmlld',name:'Domi',gender:'female',accent:'american',age:'young',desc:'Strong and confident',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/high.mp3'},
  {id:'EXAVITQu4vr4xnSDxMaL',name:'Bella',gender:'female',accent:'american',age:'young',desc:'Soft and warm',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/high.mp3'},
  {id:'MF3mGyEYCl7XYWbV9V6O',name:'Elli',gender:'female',accent:'american',age:'young',desc:'Emotional and expressive',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/high.mp3'},
  {id:'XrExE9yKIg1WjnnlVkGX',name:'Matilda',gender:'female',accent:'american',age:'young',desc:'Warm and friendly',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/high.mp3'},
  {id:'jsCqWAovK2LkecY7zXl4',name:'Freya',gender:'female',accent:'american',age:'young',desc:'Overly positive',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/jsCqWAovK2LkecY7zXl4/high.mp3'},
  {id:'oWAxZDx7w5VEj9dCyTzz',name:'Grace',gender:'female',accent:'american',age:'young',desc:'Southern charm',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/oWAxZDx7w5VEj9dCyTzz/high.mp3'},
  {id:'z9fAnlkpzviPz146aGWa',name:'Glinda',gender:'female',accent:'american',age:'young',desc:'Witch-like character',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/z9fAnlkpzviPz146aGWa/high.mp3'},
  {id:'ThT5KcBeYPX3keUQqHPh',name:'Dorothy',gender:'female',accent:'british',age:'young',desc:'Pleasant and clear',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/ThT5KcBeYPX3keUQqHPh/high.mp3'},
  {id:'LcfcDJNUP1GQjkzn1xUU',name:'Emily',gender:'female',accent:'american',age:'young',desc:'Calm meditation guide',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/LcfcDJNUP1GQjkzn1xUU/high.mp3'},
  {id:'g5CIjZEefAph4nQFvHAz',name:'Serena',gender:'female',accent:'american',age:'middle aged',desc:'Sophisticated and calm',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/g5CIjZEefAph4nQFvHAz/high.mp3'},
  {id:'piTKgcLEGmPE4e6mEKli',name:'Nicole',gender:'female',accent:'american',age:'young',desc:'Whisper and soft',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/piTKgcLEGmPE4e6mEKli/high.mp3'},
  {id:'XB0fDUnXU5powFXDhCwa',name:'Charlotte',gender:'female',accent:'british',age:'middle aged',desc:'Seductive and whispery',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/high.mp3'},
  {id:'Xb7hH8MSUJpSbSDYk0k2',name:'Alice',gender:'female',accent:'british',age:'middle aged',desc:'Confident and professional',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/Xb7hH8MSUJpSbSDYk0k2/high.mp3'},
  {id:'cgSgspJ2msm6clMCkdW9',name:'Jessica',gender:'female',accent:'american',age:'young',desc:'Expressive and forward',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/high.mp3'},
  {id:'FGY2WhTYpPnrIDTdsKH5',name:'Laura',gender:'female',accent:'american',age:'young',desc:'Upbeat and positive',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/FGY2WhTYpPnrIDTdsKH5/high.mp3'},
  {id:'iP95p4xoKVk53GoZ742B',name:'Chris',gender:'female',accent:'american',age:'middle aged',desc:'Smooth and engaging',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/iP95p4xoKVk53GoZ742B/high.mp3'},
  {id:'nPczCjzI2devNBz1zQrb',name:'Brian',gender:'male',accent:'american',age:'middle aged',desc:'Deep and calm',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/nPczCjzI2devNBz1zQrb/high.mp3'},
  {id:'ErXwobaYiN019PkySvjV',name:'Antoni',gender:'male',accent:'american',age:'young',desc:'Well-rounded voice',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/high.mp3'},
  {id:'TxGEqnHWrfWFTfGW9XjX',name:'Josh',gender:'male',accent:'american',age:'young',desc:'Deep and warm narrator',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/high.mp3'},
  {id:'VR6AewLTigWG4xSOukaG',name:'Arnold',gender:'male',accent:'american',age:'middle aged',desc:'Crisp and authoritative',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/high.mp3'},
  {id:'pNInz6obpgDQGcFmaJgB',name:'Adam',gender:'male',accent:'american',age:'middle aged',desc:'Deep and narrative',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/high.mp3'},
  {id:'yoZ06aMxZJJ28mfd3POQ',name:'Sam',gender:'male',accent:'american',age:'young',desc:'Raspy and energetic',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/yoZ06aMxZJJ28mfd3POQ/high.mp3'},
  {id:'GBv7mTt0atIp3Br8iCZE',name:'Thomas',gender:'male',accent:'american',age:'young',desc:'Calm and meditative',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/GBv7mTt0atIp3Br8iCZE/high.mp3'},
  {id:'IKne3meq5aSn9XLyUdCD',name:'Charlie',gender:'male',accent:'australian',age:'middle aged',desc:'Casual and natural',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/high.mp3'},
  {id:'N2lVS1w4EtoT3dr4eOWO',name:'Callum',gender:'male',accent:'american',age:'middle aged',desc:'Intense and hoarse',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/high.mp3'},
  {id:'ODq5zdbb76wfJdkPTFZB',name:'Patrick',gender:'male',accent:'american',age:'middle aged',desc:'Serious presence',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/ODq5zdbb76wfJdkPTFZB/high.mp3'},
  {id:'SOYHLrjzK2X1ezoPC6cr',name:'Harry',gender:'male',accent:'british',age:'young',desc:'Anxious and whispery',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/SOYHLrjzK2X1ezoPC6cr/high.mp3'},
  {id:'TX3LPaxmHKxFdv7VOQHJ',name:'Liam',gender:'male',accent:'american',age:'young',desc:'Articulate narrator',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/TX3LPaxmHKxFdv7VOQHJ/high.mp3'},
  {id:'bVMeCyTHy58xNoL34h3p',name:'Jeremy',gender:'male',accent:'irish',age:'young',desc:'Excited and expressive',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/bVMeCyTHy58xNoL34h3p/high.mp3'},
  {id:'flq6f7ik9MFCbJ8Q8f1a',name:'Michael',gender:'male',accent:'american',age:'old',desc:'Orotund and audiobook',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/flq6f7ik9MFCbJ8Q8f1a/high.mp3'},
  {id:'onwK4e9ZLuTAKqWW03F9',name:'Daniel',gender:'male',accent:'british',age:'middle aged',desc:'Deep and authoritative',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/high.mp3'},
  {id:'t0jbNlBVZ17f02VDIeMI',name:'Fin',gender:'male',accent:'irish',age:'old',desc:'Sailor character',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/t0jbNlBVZ17f02VDIeMI/high.mp3'},
  {id:'pqHfZKP75CvOlQylNhV4',name:'Bill',gender:'male',accent:'american',age:'old',desc:'Strong and trustworthy',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/pqHfZKP75CvOlQylNhV4/high.mp3'},
  {id:'CYw3kZ02Hs0563khs1Fj',name:'Dave',gender:'male',accent:'british',age:'young',desc:'Conversational podcaster',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/CYw3kZ02Hs0563khs1Fj/high.mp3'},
  {id:'JBFqnCBsd6RMkjVDRZzb',name:'George',gender:'male',accent:'british',age:'middle aged',desc:'Warm and rich',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/JBFqnCBsd6RMkjVDRZzb/high.mp3'},
  {id:'ZQe5CZNOzWyzPSCn5a3c',name:'Ethan',gender:'male',accent:'american',age:'young',desc:'Soft ASMR style',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/ZQe5CZNOzWyzPSCn5a3c/high.mp3'},
  {id:'Zlb1dXrM653N07WRdFW3',name:'Joseph',gender:'male',accent:'british',age:'middle aged',desc:'Calm audiobook narrator',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/Zlb1dXrM653N07WRdFW3/high.mp3'},
  {id:'wViXBPUzp2ZZixB1xQuM',name:'Fin (Neutral)',gender:'neutral',accent:'irish',age:'old',desc:'Neutral storyteller',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/wViXBPUzp2ZZixB1xQuM/high.mp3'},
  {id:'pMsXgVXv3BLzUgSXRplE',name:'Serena (Neutral)',gender:'neutral',accent:'american',age:'middle aged',desc:'Neutral calm voice',preview:'https://storage.googleapis.com/eleven-public-prod/premade/voices/pMsXgVXv3BLzUgSXRplE/high.mp3'},
];

let voiceFavorites = JSON.parse(localStorage.getItem('viralmax_voice_favs') || '[]');
let showFavoritesOnly = false;
let pendingCustomVoiceId = null;
let selectedVoiceId = '21m00Tcm4TlvDq8ikWAM';

async function openVoicePicker() {
  document.getElementById('voicePickerModal').style.display = 'flex';
  document.getElementById('voiceSearch').value = '';
  document.getElementById('filterGender').value = '';
  document.getElementById('filterAccent').value = '';
  document.getElementById('filterAge').value = '';
  showFavoritesOnly = false;
  document.getElementById('favFilterBtn').style.background = 'var(--s3)';
  document.getElementById('favFilterBtn').style.color = 'var(--t2)';
  // Fetch real preview URLs if not already loaded
  if (!window.voicesLoaded) {
    document.getElementById('voicePickerList').innerHTML = '<div class="empty" style="padding:40px;"><span class="empty-icon">⏳</span><div class="empty-txt">Loading voices...</div></div>';
    try {
      console.log('Fetching elevenlabs-voices...');
      const r = await fetch('/elevenlabs-voices');
      console.log('Response status:', r.status);
      const data = await r.json();
      console.log('Voices response:', data.success, data.voices?.length);
      if (data.success && data.voices.length) {
        // Merge preview URLs into ALL_VOICES
        window.LIVE_VOICES = data.voices;
        window.voicesLoaded = true;
      }
    } catch(e) { console.log('Could not fetch voice previews:', e.message, e); }
  }
  // Use API voices if loaded, fall back to ALL_VOICES
  window.LIVE_VOICES = window.LIVE_VOICES || [];
  renderVoicePickerList(window.LIVE_VOICES.length ? window.LIVE_VOICES : ALL_VOICES);
}

function closeVoicePicker(e) {
  if (e.target === document.getElementById('voicePickerModal')) document.getElementById('voicePickerModal').style.display = 'none';
}

function filterVoices() {
  const search = document.getElementById('voiceSearch').value.toLowerCase();
  const gender = document.getElementById('filterGender').value;
  const accent = document.getElementById('filterAccent').value;
  const age = document.getElementById('filterAge').value;
  const source = window.LIVE_VOICES && window.LIVE_VOICES.length ? window.LIVE_VOICES : ALL_VOICES;
  let filtered = source.filter(v => {
    if (showFavoritesOnly && !voiceFavorites.includes(v.id)) return false;
    if (search && !v.name.toLowerCase().includes(search) && !v.desc.toLowerCase().includes(search)) return false;
    if (gender && v.gender !== gender) return false;
    if (accent && v.accent !== accent) return false;
    if (age && v.age !== age) return false;
    return true;
  });
  renderVoicePickerList(filtered);
}

function toggleFavoritesFilter() {
  showFavoritesOnly = !showFavoritesOnly;
  const btn = document.getElementById('favFilterBtn');
  btn.style.background = showFavoritesOnly ? 'var(--yd)' : 'var(--s3)';
  btn.style.color = showFavoritesOnly ? 'var(--y)' : 'var(--t2)';
  btn.style.borderColor = showFavoritesOnly ? 'rgba(255,230,0,0.3)' : 'var(--bd)';
  filterVoices();
}

function renderVoicePickerList(voices) {
  const list = document.getElementById('voicePickerList');
  if (!voices.length) { list.innerHTML = '<div class="empty" style="padding:40px;"><span class="empty-icon">🎙</span><div class="empty-txt">No voices match your filters</div></div>'; return; }
  list.innerHTML = voices.map(v => {
    const isFav = voiceFavorites.includes(v.id);
    const isSelected = selectedVoiceId === v.id;
    return `<div onclick="selectDefaultVoice('${v.id}','${v.name}')" style="display:flex;align-items:center;gap:12px;padding:10px 20px;cursor:pointer;transition:background 0.12s;border-bottom:1px solid var(--bd);${isSelected?'background:var(--yd);':''}" onmouseover="this.style.background='var(--s3)'" onmouseout="this.style.background='${isSelected?'var(--yd)':'transparent'}'">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--s4);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${v.gender==='female'?'👩':v.gender==='male'?'👨':'🎭'}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:700;color:var(--tx);">${v.name} ${isSelected?'<span style="color:var(--y);font-size:10px;">✓ Selected</span>':''}</div>
        <div style="font-size:11px;color:var(--t3);margin-top:1px;">${v.desc} · ${v.accent} · ${v.age}</div>
      </div>
      <button onclick="event.stopPropagation();previewVoice('${v.id}')" id="prev-${v.id}" style="background:var(--s4);border:1px solid var(--bd);border-radius:6px;color:var(--t2);font-size:11px;padding:5px 9px;cursor:pointer;flex-shrink:0;transition:all 0.15s;" onmouseover="this.style.borderColor='rgba(255,230,0,0.3)';this.style.color='var(--y)'" onmouseout="this.style.borderColor='var(--bd)';this.style.color='var(--t2)'">▶</button>
      <button onclick="event.stopPropagation();toggleFavorite('${v.id}')" style="background:none;border:none;font-size:16px;cursor:pointer;color:${isFav?'var(--y)':'var(--t3)'};padding:4px;" id="fav-${v.id}">${isFav?'★':'☆'}</button>
    </div>`;
  }).join('');
}

function selectDefaultVoice(id, name) {
  selectedVoiceId = id;
  document.getElementById('selectedVoiceLabel').textContent = name;
  document.getElementById('voicePickerModal').style.display = 'none';
}

function toggleFavorite(id) {
  if (voiceFavorites.includes(id)) voiceFavorites = voiceFavorites.filter(f => f !== id);
  else voiceFavorites.push(id);
  localStorage.setItem('viralmax_voice_favs', JSON.stringify(voiceFavorites));
  const btn = document.getElementById('fav-' + id);
  if (btn) { btn.textContent = voiceFavorites.includes(id) ? '★' : '☆'; btn.style.color = voiceFavorites.includes(id) ? 'var(--y)' : 'var(--t3)'; }
}

function promptSaveCustomVoice() {
  const id = document.getElementById('customVoiceIdInp').value.trim();
  if (!id) { alert('Paste a Voice ID first'); return; }
  pendingCustomVoiceId = id;
  document.getElementById('customVoiceNameInp').value = '';
  document.getElementById('customVoiceNameModal').style.display = 'flex';
}

function confirmSaveCustomVoice() {
  const name = document.getElementById('customVoiceNameInp').value.trim();
  if (!name) { alert('Enter a name'); return; }
  const customs = loadCustomVoicesV2();
  if (!customs.find(v => v.id === pendingCustomVoiceId)) {
    customs.push({ id: pendingCustomVoiceId, name });
    saveCustomVoicesV2(customs);
  }
  document.getElementById('customVoiceIdInp').value = '';
  document.getElementById('customVoiceNameModal').style.display = 'none';
  pendingCustomVoiceId = null;
  renderCustomVoicesList();
}


let currentPreviewAudio = null;

function previewVoice(id) {
  const btn = document.getElementById('prev-' + id);
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio = null;
    document.querySelectorAll('[id^="prev-"]').forEach(b => b.textContent = '▶');
    if (btn && btn.dataset.playing === 'true') { btn.dataset.playing = 'false'; return; }
  }
  const src = (window.LIVE_VOICES && window.LIVE_VOICES.length) ? window.LIVE_VOICES : ALL_VOICES;
  const v = src.find(x => x.id === id);
  const url = v?.preview;
  console.log('previewVoice:', id, url, 'live count:', window.LIVE_VOICES?.length);
  if (!url) { if (btn) { btn.textContent = '✕'; setTimeout(() => { if(btn) btn.textContent = '▶'; }, 1500); } return; }
  currentPreviewAudio = new Audio(url);
  if (btn) { btn.textContent = '■'; btn.dataset.playing = 'true'; }
  currentPreviewAudio.play().catch(() => {
    if (btn) { btn.textContent = '▶'; btn.dataset.playing = 'false'; }
    alert('No preview available for this voice');
  });
  currentPreviewAudio.onended = () => {
    if (btn) { btn.textContent = '▶'; btn.dataset.playing = 'false'; }
    currentPreviewAudio = null;
  };
}
function loadCustomVoicesV2() { try { return JSON.parse(localStorage.getItem('viralmax_custom_voices_v2') || '[]'); } catch { return []; } }
function saveCustomVoicesV2(v) { localStorage.setItem('viralmax_custom_voices_v2', JSON.stringify(v)); }

function renderCustomVoicesList() {
  const list = document.getElementById('customVoicesList');
  const customs = loadCustomVoicesV2();
  if (!customs.length) { list.innerHTML = '<div style="font-size:11px;color:var(--t3);padding:4px 0;">No custom voices saved yet</div>'; return; }
  list.innerHTML = customs.map((v,i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--s3);border:1px solid ${selectedVoiceId===v.id?'rgba(255,230,0,0.3)':'var(--bd)'};border-radius:7px;cursor:pointer;" onclick="selectCustomVoice('${v.id}','${v.name}')">
      <span style="font-size:13px;">🎙</span>
      <span style="flex:1;font-size:12px;font-weight:600;color:${selectedVoiceId===v.id?'var(--y)':'var(--tx)'};">${v.name}</span>
      <span style="font-size:9px;color:var(--t3);font-family:'Space Mono',monospace;">${v.id.slice(0,8)}…</span>
      <button onclick="event.stopPropagation();deleteCustomVoice(${i})" style="background:none;border:none;color:var(--t3);cursor:pointer;font-size:12px;padding:2px 4px;border-radius:4px;" onmouseover="this.style.color='var(--red)'" onmouseout="this.style.color='var(--t3)'">✕</button>
    </div>`).join('');
}

function selectCustomVoice(id, name) {
  selectedVoiceId = id;
  document.getElementById('selectedVoiceLabel').textContent = name + ' (custom)';
  renderCustomVoicesList();
}

function deleteCustomVoice(idx) {
  const customs = loadCustomVoicesV2();
  customs.splice(idx, 1);
  saveCustomVoicesV2(customs);
  if (selectedVoiceId === customs[idx]?.id) selectedVoiceId = '21m00Tcm4TlvDq8ikWAM';
  renderCustomVoicesList();
}

function saveCustomVoiceId_OLD() {
  const id = document.getElementById('customVoiceIdInp').value.trim();
  if (!id) { alert('Enter a voice ID'); return; }
  const sel = document.getElementById('voiceSel');
  const existing = Array.from(sel.options).find(o => o.value === id);
  if (!existing) {
    const o = document.createElement('option');
    o.value = id; o.textContent = 'Custom: ' + id.slice(0, 12) + '…';
    sel.appendChild(o);
  }
  sel.value = id;
  selVoiceId = id;
  document.getElementById('customVoiceIdInp').value = '';
}

function updateVoiceModel() {
  localStorage.setItem('vm_model', document.getElementById('voiceModelSelect').value);
}

function toggleVoiceCard() {
  const body = document.getElementById('voiceCardBody');
  const arrow = document.getElementById('voiceCardArrow');
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  arrow.style.transform = hidden ? '' : 'rotate(-90deg)';
  localStorage.setItem('vm_voiceCard', hidden ? 'open' : 'closed');
}

function toggleModelCard() {
  const body = document.getElementById('modelCardBody');
  const arrow = document.getElementById('modelCardArrow');
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  arrow.style.transform = hidden ? '' : 'rotate(-90deg)';
  localStorage.setItem('vm_modelCard', hidden ? 'open' : 'closed');
}

function toggleSettingsCard() {
  const body = document.getElementById('settingsCardBody');
  const arrow = document.getElementById('settingsCardArrow');
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  arrow.style.transform = hidden ? '' : 'rotate(-90deg)';
  localStorage.setItem('vm_settingsCard', hidden ? 'open' : 'closed');
}

function restoreVoicePrefs() {
  // Restore model
  const model = localStorage.getItem('vm_model');
  if (model) { const sel = document.getElementById('voiceModelSelect'); if (sel) sel.value = model; }
  // Restore sliders
  const speed = localStorage.getItem('vm_speed'); if (speed) { const el = document.getElementById('speedSlider'); if (el) { el.value = speed; document.getElementById('speedVal').textContent = speed; } }
  const stability = localStorage.getItem('vm_stability'); if (stability) { const el = document.getElementById('stabilitySlider'); if (el) { el.value = stability; document.getElementById('stabilityVal').textContent = stability + '%'; } }
  const similarity = localStorage.getItem('vm_similarity'); if (similarity) { const el = document.getElementById('similaritySlider'); if (el) { el.value = similarity; document.getElementById('similarityVal').textContent = similarity + '%'; } }
  const exag = localStorage.getItem('vm_exag'); if (exag) { const el = document.getElementById('exagSlider'); if (el) { el.value = exag; document.getElementById('exagVal').textContent = exag; } }
  // Restore card states
  ['voiceCard','modelCard','settingsCard'].forEach(card => {
    const state = localStorage.getItem('vm_' + card);
    if (state === 'closed') {
      const body = document.getElementById(card + 'Body');
      const arrow = document.getElementById(card + 'Arrow');
      if (body) body.style.display = 'none';
      if (arrow) arrow.style.transform = 'rotate(-90deg)';
    }
  });
}
function onCloneVoiceChange() { selVoiceId = document.getElementById('cloneVoiceSel').value; const v = loadVoices().find(x => x.id === selVoiceId); selVoiceName = v ? v.name : 'Clone'; updateDelBtn(); }

async function startVoiceGen() {
  if(!await requireCredits(5))return;
  const script = document.getElementById('voiceScript').value.trim();
  if (!script) { alert('Enter a script'); return; }
  const voiceId = selectedVoiceId;
  if (!voiceId) { alert('Select a voice'); return; }
  const btn = document.getElementById('voiceBtn');
  btn.disabled = true; btn.textContent = '⏳ Generating…';
  document.getElementById('voiceProg').classList.add('vis');
  document.getElementById('voiceErr').classList.remove('vis');
  let pct = 0;
  const fill = document.getElementById('vrFill'), pctLbl = document.getElementById('voiceProgPct'), lbl = document.getElementById('voiceProgLbl');
  const tick = setInterval(() => { if (pct < 90) { pct += Math.random() * 3; if (pct > 90) pct = 90; fill.style.width = pct + '%'; pctLbl.textContent = Math.round(pct) + '%'; if (pct > 20) lbl.textContent = 'Generating…'; } }, 600);
  try {
    const res = await fetch('/generate-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: script,
        voiceId,
        speed: parseFloat(document.getElementById('speedSlider').value),
        stability: parseFloat(document.getElementById('stabilitySlider').value) / 100,
        similarity: parseFloat(document.getElementById('similaritySlider').value) / 100,
        exaggeration: parseFloat(document.getElementById('exagSlider').value),
        model: document.getElementById('voiceModelSelect').value,
      })
    });
    const data = await res.json();
    clearInterval(tick); fill.style.width = '100%'; pctLbl.textContent = '100%';
    if (!data.success) throw new Error(data.error || 'Failed');
    const charCount = script.length;
    creds -= Math.ceil(charCount / 1000) || 1; updCreds();
    addVoiceOutput(data.audioUrl, script.slice(0, 60) + (script.length > 60 ? '…' : ''), 'Voice');
  } catch(err) {
    clearInterval(tick);
    document.getElementById('voiceErr').classList.add('vis');
    document.getElementById('voiceErrMsg').textContent = err.message;
  }
  btn.disabled=false;btn.innerHTML='<div class="gen-left" style="flex:1;justify-content:center;font-size:17px;font-weight:800;letter-spacing:-.02em;">Generate Speech</div><div class="credits-pill" id="voiceCostDisplay" style="background:rgba(20,14,4,0.75);border:1px solid rgba(255,160,0,0.25);"><img src="/public/credits-icon.png" style="width:28px;height:28px;object-fit:contain;flex-shrink:0;"><span id="voiceCostNum" style="color:#FFAA00;font-weight:800;font-size:13px;">0</span></div>';
  setTimeout(() => document.getElementById('voiceProg').classList.remove('vis'), 2000);
}

async function startCloneGen() {
  if(!await requireCredits(10))return;
  const script = document.getElementById('voiceScript').value.trim();
  if (!script) { alert('Enter a script'); return; }
  if (!selVoiceId) { alert('Select a voice first'); return; }
  const btn = document.getElementById('cloneVoiceBtn');
  btn.disabled = true; btn.textContent = '⏳ Generating…';
  document.getElementById('voiceProg').classList.add('vis');
  document.getElementById('voiceErr').classList.remove('vis');
  let pct = 0;
  const fill = document.getElementById('vrFill'), pctLbl = document.getElementById('voiceProgPct'), lbl = document.getElementById('voiceProgLbl');
  const tick = setInterval(() => { if (pct < 95) { const inc = pct < 30 ? 2 : pct < 60 ? .8 : .2; pct += Math.random() * inc; if (pct > 95) pct = 95; fill.style.width = pct + '%'; pctLbl.textContent = Math.round(pct) + '%'; if (pct > 15) lbl.textContent = 'Waiting for GPU…'; if (pct > 40) lbl.textContent = 'Generating audio…'; } }, 800);
  try {
    const voices = loadVoices(); const v = voices.find(x => x.id === selVoiceId); if (!v) throw new Error('Voice not found');
    const byteStr = atob(v.audioB64), ab = new ArrayBuffer(byteStr.length), ia = new Uint8Array(ab);
    for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
    const blob = new Blob([ab], { type: v.mimeType || 'audio/wav' });
    const fd = new FormData();
    fd.append('text', script); fd.append('exaggeration', document.getElementById('cloneExagSlider').value);
    fd.append('cfgWeight', '0.5'); fd.append('temperature', '0.8'); fd.append('voiceSample', blob, 'voice.wav');
    const res = await fetch('/generate-voice', { method: 'POST', body: fd });
    const data = await res.json();
    clearInterval(tick); fill.style.width = '100%'; pctLbl.textContent = '100%';
    if (!data.success) throw new Error(data.error || 'Failed');
    addVoiceOutput(data.audioUrl, script.slice(0, 60) + (script.length > 60 ? '…' : ''), selVoiceName);
  } catch(err) {
    clearInterval(tick);
    document.getElementById('voiceErr').classList.add('vis');
    document.getElementById('voiceErrMsg').textContent = err.message;
  }
  btn.disabled=false;btn.innerHTML='<div class="gen-left" style="flex:1;justify-content:center;font-size:17px;font-weight:800;letter-spacing:-.02em;">Generate Speech</div><div class="credits-pill" id="voiceCostDisplay" style="background:rgba(20,14,4,0.75);border:1px solid rgba(255,160,0,0.25);"><img src="/public/credits-icon.png" style="width:28px;height:28px;object-fit:contain;flex-shrink:0;"><span id="voiceCostNum" style="color:#FFAA00;font-weight:800;font-size:13px;">0</span></div>';
  setTimeout(() => document.getElementById('voiceProg').classList.remove('vis'), 2000);
}

function loadVoiceOutputs(){try{return JSON.parse(localStorage.getItem('viralmax_vo_outputs')||'[]')}catch{return[]}}
function saveVoiceOutputs(o){localStorage.setItem('viralmax_vo_outputs',JSON.stringify(o))}
function addVoiceOutput(audioUrl,preview,voiceName){
  const outputs=loadVoiceOutputs();outputs.unshift({id:'vo_'+Date.now(),audioUrl,scriptPreview:preview,voiceName,ts:Date.now()});
  saveVoiceOutputs(outputs);renderVoiceOutputs();
}
function deleteVoiceOutput(id,e){e.stopPropagation();saveVoiceOutputs(loadVoiceOutputs().filter(o=>o.id!==id));renderVoiceOutputs()}
function renderVoiceOutputs(){
  const list=document.getElementById('voiceOutputList'),empty=document.getElementById('voiceOutputEmpty');
  const outputs=loadVoiceOutputs();list.querySelectorAll('.vo-card').forEach(el=>el.remove());
  if(!outputs.length){if(empty)empty.style.display='block';return}if(empty)empty.style.display='none';
  outputs.forEach(o=>{
    const card=document.createElement('div');card.className='vo-card';
    const ts=new Date(o.ts).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    card.innerHTML=`<div class="vo-top"><div style="flex:1;min-width:0;"><div class="vo-preview">${o.scriptPreview}</div><div class="vo-meta">🎙 ${o.voiceName} · ${ts}</div></div><button class="vo-del" onclick="deleteVoiceOutput('${o.id}',event)">✕</button></div><audio class="vo-audio" controls src="${o.audioUrl}"></audio><a href="${o.audioUrl}" download="voiceover.wav" class="vo-dl">⬇ Download</a>`;
    list.appendChild(card);
  });
}
function updateCharCount(){const n=document.getElementById('voiceScript').value.length;const el=document.getElementById('charCount');el.textContent=n;el.style.color=n>190000?'var(--red)':n>150000?'var(--y)':'var(--t3)';const costEl=document.getElementById('voiceCostDisplay');const _cn=document.getElementById('voiceCostNum');if(_cn)_cn.textContent=n===0?'0':(Math.ceil(n/1000)||1);}
