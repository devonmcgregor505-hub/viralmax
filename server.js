require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// ── Supabase + Stripe ──
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ── Plan price IDs (set in Railway env) ──
const PRICE_FREE    = null;
const PRICE_PRO     = process.env.STRIPE_PRICE_PRO     || 'price_YOUR_PRO_PRICE_ID';
const PRICE_ELITE   = process.env.STRIPE_PRICE_ELITE   || 'price_YOUR_ELITE_PRICE_ID';

// ── App ──
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => { req.setTimeout(0); res.setTimeout(0); next(); });
app.use(cors());

// ── Stripe webhook (must be before express.json()) ──
app.post('/api/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send('Webhook error: ' + err.message);
  }

  // New subscription / one-time purchase
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    console.log('[webhook] checkout completed userId:', userId, 'plan:', plan);
    if (userId) {
      try {
        const updateObj = {
          id: userId,
          plan: plan || 'pro',
          updated_at: new Date().toISOString()
        };
        if (session.subscription) updateObj.stripe_subscription_id = session.subscription;
        if (session.customer)     updateObj.stripe_customer_id = session.customer;
        const { error } = await supabase.from('users').upsert(updateObj);
        if (error) console.error('[webhook] supabase error:', error.message);
        else console.log('[webhook] plan updated to:', plan);
      } catch(err) { console.error('[webhook] error:', err.message); }
    }
  }

  // Subscription cancelled / expired
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    try {
      const { data } = await supabase.from('users')
        .select('id').eq('stripe_subscription_id', sub.id).single();
      if (data) {
        await supabase.from('users')
          .update({ plan: 'free', updated_at: new Date().toISOString() })
          .eq('id', data.id);
        console.log('[webhook] plan downgraded to free for:', data.id);
      }
    } catch(err) { console.error('[webhook] cancel error:', err.message); }
  }

  res.json({ received: true });
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Static files ──
app.use(express.static(__dirname));

// ── Page routes ──
app.get('/',         (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app',      (req, res) => res.sendFile(path.join(__dirname, 'app.html')));
app.get('/login',    (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/signup',   (req, res) => res.sendFile(path.join(__dirname, 'signup.html')));
app.get('/legal',    (req, res) => res.sendFile(path.join(__dirname, 'legal.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'checkout.html')));
app.get('/pricing',  (req, res) => res.redirect('/#pricing'));
app.get('/admin',    (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ══════════════════════════════════════════════════════════════════════════════
// CLAUDE API HELPER
// ══════════════════════════════════════════════════════════════════════════════
async function callClaude(messages, systemPrompt = '', maxTokens = 1024) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set in .env');
  const body = { model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, messages };
  if (systemPrompt) body.system = systemPrompt;
  const res = await axios.post('https://api.anthropic.com/v1/messages', body, {
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    timeout: 60000,
  });
  return res.data.content?.[0]?.text || '';
}

// ══════════════════════════════════════════════════════════════════════════════
// ASCEND API ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// ── AI Chat (proxies Claude, keeps API key server-side) ──
app.post('/api/chat', async (req, res) => {
  const { messages, profile, max_tokens } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }
  const age    = profile?.age    || '19';
  const goal   = profile?.goal   || 'look better and improve appearance';
  const focus  = profile?.focus  || 'skincare, grooming, hair, physique, diet, sleep, jaw/posture, fitness';
  const acct   = profile?.acct   || 'flexible';
  const train  = profile?.train  || 'mixed';
  const wake   = profile?.wake   || '7am–8am';

  const system = `You are Ascend AI — a sharp, practical health and appearance coach. Your user is ${age} years old, ${profile?.height||'unknown'}cm tall, ${profile?.weight||'unknown'}kg. Their goal: ${goal}. Focus areas: ${focus}. Training style: ${train}. Wake time: ${wake}. Accountability style: ${acct} and encouraging. Be direct, specific, and actionable. No fluff. Keep responses concise but complete. Never use markdown headers or bullet asterisks — use plain text with dashes for lists if needed.`;

  try {
    const tokens = max_tokens || 800;
    const reply = await callClaude(messages, system, tokens);
    res.json({ reply, content: [{ type: 'text', text: reply }] });
  } catch(err) {
    console.error('[api/chat] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Generate personalised routine via Claude ──
app.post('/api/routine/generate', async (req, res) => {
  const { profile } = req.body;
  if (!profile) return res.status(400).json({ error: 'profile required' });

  const prompt = `Generate a personalised daily routine for someone with this profile:
Age: ${profile.age}
Goal: ${profile.goal}
Focus areas: ${profile.focus}
Training: ${profile.train}
Wake time: ${profile.wake}
Accountability: ${profile.acct}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "morning": [
    { "time": "7:00", "title": "...", "tag": "mind|skin|hair|body|frame", "tagLabel": "...", "items": ["..."], "note": "..." }
  ],
  "night": [
    { "time": "21:00", "title": "...", "tag": "mind|skin|hair|body|frame", "tagLabel": "...", "items": ["..."], "note": "..." }
  ],
  "habits": [
    { "name": "...", "desc": "...", "cat": "skin|body|mind|frame|sleep" }
  ]
}
Include 4-5 morning blocks, 4-5 night blocks, and 7-8 daily habits. Be specific and practical.`;

  try {
    const raw = await callClaude([{ role: 'user', content: prompt }], '', 2000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const routine = JSON.parse(clean);
    res.json({ success: true, routine });
  } catch(err) {
    console.error('[api/routine/generate] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Save checklist state ──
app.post('/api/checklist/save', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ ok: true }); // guest mode, skip
  const { checked, date } = req.body;
  try {
    const { error } = await supabase.from('checklist_logs').upsert({
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
      checked: checked,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });
    if (error) throw error;
    res.json({ ok: true });
  } catch(err) {
    console.error('[api/checklist/save] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Get checklist history ──
app.get('/api/checklist/history', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ logs: [] });
  try {
    const { data, error } = await supabase
      .from('checklist_logs')
      .select('date, checked')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);
    if (error) throw error;
    res.json({ logs: data || [] });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Save user profile ──
app.post('/api/profile/save', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ ok: true });
  const { profile } = req.body;
  try {
    const { error } = await supabase.from('users')
      .upsert({ id: userId, profile, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
    res.json({ ok: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get streak ──
app.get('/api/streak', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ streak: 0 });
  try {
    const { data } = await supabase
      .from('checklist_logs')
      .select('date, checked')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(60);
    if (!data || data.length === 0) return res.json({ streak: 0 });

    // Count consecutive days with at least 1 habit checked
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < data.length; i++) {
      const logDate = new Date(data[i].date);
      const diffDays = Math.floor((today - logDate) / 86400000);
      if (diffDays === i && data[i].checked?.length > 0) streak++;
      else break;
    }
    res.json({ streak });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Generate meal plan ──
app.post('/api/nutrition/mealplan', async (req, res) => {
  const { profile, calories = 2600, protein = 160 } = req.body;
  const prompt = `Create a practical full week meal plan for a ${profile?.age || 19} year old male. Target: ${calories} calories/day, ${protein}g protein/day. Goals: appearance improvement and muscle building. Based in New Zealand so use realistic, affordable, easy-to-find ingredients. Format as plain text, one day per section, breakfast/lunch/dinner/snacks. Keep it simple and repeatable. No markdown headers.`;
  try {
    const plan = await callClaude([{ role: 'user', content: prompt }], '', 1200);
    res.json({ success: true, plan });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Generate workout breakdown ──
app.post('/api/training/workout', async (req, res) => {
  const { day = 'upper push', profile } = req.body;
  const prompt = `Write a complete gym workout for ${day} day for a ${profile?.age || 19} year old male focused on physique and appearance. Include: exercise name, sets, reps, rest time, and a brief note on form or why it's included. Also include a warmup. Format as plain text with dashes. No markdown headers.`;
  try {
    const workout = await callClaude([{ role: 'user', content: prompt }], '', 800);
    res.json({ success: true, workout });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});


// ── Save daily score ──
app.post('/api/scores/save', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ ok: true });
  const { date, score, completed_items, total_items } = req.body;
  try {
    const { error } = await supabase.from('daily_scores').upsert({
      user_id: userId,
      date: date || new Date().toISOString().split('T')[0],
      score,
      completed_items: completed_items || [],
      total_items: total_items || 0,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' });
    if (error) throw error;
    res.json({ ok: true });
  } catch(err) {
    console.error('[scores/save]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Get score history ──
app.get('/api/scores/history', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ scores: [] });
  try {
    const { data, error } = await supabase
      .from('daily_scores')
      .select('date, score, completed_items, total_items')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(90);
    if (error) throw error;
    res.json({ scores: data || [] });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Save user data (per-section) ──
app.post('/api/data/save', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ ok: true });
  const { section, data } = req.body;
  const allowed = ['meals','macros','workouts','bodyweight','lmg','day_plans','settings','checkins','reminders','checklist'];
  if (!allowed.includes(section)) return res.status(400).json({ error: 'invalid section' });
  try {
    const update = { user_id: userId, updated_at: new Date().toISOString() };
    update[section] = data;
    const { error } = await supabase.from('user_data').upsert(update, { onConflict: 'user_id' });
    if (error) throw error;
    res.json({ ok: true });
  } catch(err) {
    console.error('[data/save]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Load all user data ──
app.get('/api/data/load', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ data: null });
  try {
    const { data, error } = await supabase.from('user_data').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ data: data || null });
  } catch(err) {
    console.error('[data/load]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTH + USER ROUTES
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/credits', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ plan: 'free' });
  const { data } = await supabase.from('users').select('plan, profile').eq('id', userId).single();
  res.json({ plan: data?.plan || 'free', profile: data?.profile || null });
});

app.post('/api/portal', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    const { data } = await supabase.from('users').select('stripe_customer_id').eq('id', userId).single();
    if (!data?.stripe_customer_id) return res.status(400).json({ error: 'No subscription found.' });
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: origin + '/app',
    });
    res.json({ url: session.url });
  } catch(err) {
    console.error('[portal] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// CHECKOUT ROUTES
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/checkout/plan', async (req, res) => {
  try {
    const userId    = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    const origin    = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
    const { plan }  = req.body;
    const priceMap  = { pro: PRICE_PRO, elite: PRICE_ELITE };
    const price     = priceMap[plan];
    if (!price) return res.status(400).json({ error: 'Invalid plan' });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price, quantity: 1 }],
      success_url: origin + '/app?upgraded=1',
      cancel_url:  origin + '/checkout',
      customer_email: userEmail,
      metadata: { userId, plan }
    });
    res.json({ url: session.url });
  } catch(err) {
    console.error('[checkout/plan] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════════════════════════════════════════════
const ADMIN_EMAIL = 'devonmcgregor505@gmail.com';
function isAdmin(req) { return req.headers['x-admin-key'] === ADMIN_EMAIL; }

app.get('/api/admin/users', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ users: data });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/set-plan', async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
  const { userId, plan } = req.body;
  try {
    const { error } = await supabase.from('users').update({ plan }).eq('id', userId);
    if (error) throw error;
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log('\n✅ Ascend running at http://localhost:' + PORT);
  console.log('   ANTHROPIC_API_KEY :', process.env.ANTHROPIC_API_KEY  ? '✓' : '✗');
  console.log('   SUPABASE_URL      :', process.env.SUPABASE_URL       ? '✓' : '✗');
  console.log('   STRIPE_SECRET_KEY :', process.env.STRIPE_SECRET_KEY  ? '✓' : '✗');
});

process.on('uncaughtException', err => {
  if (err.code === 'EPIPE') return;
  console.error('Uncaught exception:', err.message);
});
