export async function api(path: string, opts: RequestInit = {}) {
  const base = (import.meta as any).env.VITE_API_BASE || 'http://localhost:4000';
  const token = localStorage.getItem('access_token') || '';
  const url = `${base}${path}`;
  
  console.log('API call:', { url, opts, token: token ? 'present' : 'missing' });
  
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  
  console.log('API response:', { status: res.status, ok: res.ok });
  
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}


