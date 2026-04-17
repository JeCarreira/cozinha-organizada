export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase não configurado no Vercel' });
  }

  try {
    const { action, table, codigo, payload } = req.body || {};
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates,return=representation'
    };

    if (action === 'load') {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?codigo=eq.${encodeURIComponent(codigo)}&limit=1`,
        { headers }
      );
      const data = await r.json();
      return res.status(200).json(data && data[0] ? data[0] : null);
    }

    if (action === 'save') {
      // Upsert: insert or update
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}`,
        { method: 'POST', headers, body: JSON.stringify({ codigo, ...payload, updated_at: new Date().toISOString() }) }
      );
      const data = await r.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'action must be load or save' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
