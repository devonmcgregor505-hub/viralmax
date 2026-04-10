const SUPABASE_URL = 'https://asvpzsnncbxkpycsgfnj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzdnB6c25uY2J4a3B5Y3NnZm5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3OTMwOTksImV4cCI6MjA5MTM2OTA5OX0.S1poy30uv9R6_xG8d-wi27eIgeXbvlVIaLbgAljM4j0';
async function getSupabase() {
  if (window._sb) return window._sb;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  window._sb = createClient(SUPABASE_URL, SUPABASE_ANON);
  return window._sb;
}
async function getSession() { const sb = await getSupabase(); const { data } = await sb.auth.getSession(); return data.session; }
async function getUser() { const sb = await getSupabase(); const { data } = await sb.auth.getUser(); return data.user; }
async function requireAuth() { const s = await getSession(); if (!s) { window.location.href = '/login'; return null; } return s; }
async function signOut() { const sb = await getSupabase(); await sb.auth.signOut(); window.location.href = '/'; }
async function getCredits() {
  const user = await getUser();
  if (!user) return 500;
  const resp = await fetch('/api/credits', { headers: { 'x-user-id': user.id } });
  const data = await resp.json();
  return data.credits ?? 500;
}
