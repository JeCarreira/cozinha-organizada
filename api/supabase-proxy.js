export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try {
    const { table, method, data, filter } = req.body || {};

    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    };

    let fetchMethod = method || 'GET';
    let body = undefined;

    if (method === 'POST') {
      // Upsert — insert or update on conflict
      headers['Prefer'] = 'resolution=merge-duplicates,return=representation';
      body = JSON.stringify(data);
    } else if (method === 'PATCH') {
      url += filter ? `?${filter}` : '';
      headers['Prefer'] = 'return=representation';
      body = JSON.stringify(data);
    } else if (method === 'GET') {
      url += filter ? `?${filter}` : '';
    }

    const response = await fetch(url, { method: fetchMethod, headers, body });
    const text = await response.text();
    
    let result;
    try { result = JSON.parse(text); } catch(e) { result = { raw: text }; }

    return res.status(response.status).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
