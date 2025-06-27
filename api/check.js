// api/check.js

import fetch from 'node-fetch'; // Anda mungkin perlu menginstal 'node-fetch' jika runtime-nya bukan Node.js terbaru

export default async function handler(req, res) {
  // Dapatkan URL dari request
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Dapatkan nilai dari parameter query 'target'
  const target = url.searchParams.get('target');
  
  // Cek apakah parameter 'target' ada
  if (!target) {
    res.status(400).json({ error: "Missing 'target' query parameter" });
    return;
  }

  // Pisahkan IP dan port
  const [ip, port] = target.split(':');
  if (!ip || !port) {
    res.status(400).json({ error: "Invalid target format. Expected 'ip:port'" });
    return;
  }

  // URL API eksternal untuk pemeriksaan kesehatan
  const PROXY_HEALTH_CHECK_API = "https://id1.foolvpn.me/api/v1/check";
  const apiUrl = `${PROXY_HEALTH_CHECK_API}?ip=${ip}:${port}`;

  try {
    // Lakukan permintaan ke API eksternal
    const response = await fetch(apiUrl);

    // Cek apakah respons berhasil
    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `External API error: ${errorText}` });
      return;
    }

    // Parse respons JSON
    const data = await response.json();
    
    // Kembalikan data yang diterima
    res.status(200).json(data);

  } catch (error) {
    console.error('Failed to fetch health check API:', error);
    res.status(500).json({ error: 'Failed to check proxy health' });
  }
}
