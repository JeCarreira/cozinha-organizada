export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_ANON_KEY;

  if (!URL || !KEY) {
    return res.status(500).json({ error: 'ENV_MISSING', detail: 'SUPABASE_URL e SUPABASE_ANON_KEY nao configurados no Vercel' });
  }

  const { action, table, codigo, payload } = req.body || {};
  if (!action || !table || !codigo) {
    return res.status(400).json({ error: 'Faltam campos: action, table, codigo' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': KEY,
    'Authorization': `Bearer ${KEY}`,
  };

  try {
    if (action === 'load') {
      const r = await fetch(
        `${URL}/rest/v1/${table}?codigo=eq.${encodeURIComponent(codigo)}&limit=1`,
        { method: 'GET', headers }
      );
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = []; }
      if (!r.ok) return res.status(r.status).json({ error: 'Supabase load error', detail: data });
      return res.status(200).json(Array.isArray(data) && data.length > 0 ? data[0] : null);
    }

    if (action === 'save') {
      const body = { codigo, ...payload, updated_at: new Date().toISOString() };
      const r = await fetch(`${URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(body)
      });
      if (r.status === 200 || r.status === 201 || r.status === 204) {
        return res.status(200).json({ ok: true });
      }
      const text = await r.text();
      let errData; try { errData = JSON.parse(text); } catch(e) { errData = { raw: text }; }
      return res.status(r.status).json({ error: 'Supabase save failed', detail: errData });
    }

    return res.status(400).json({ error: 'action deve ser load ou save' });
  } catch (err) {
    return res.status(500).json({ error: 'SERVER_ERROR', detail: err.message });
  }
}
