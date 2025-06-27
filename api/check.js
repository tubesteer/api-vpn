// api/check.js

// PENTING: Gunakan 'export default' untuk mengekspor fungsi handler di Vercel
export default async function handler(req, res) {
  // Log awal untuk setiap permintaan yang masuk
  console.log('--- Incoming request to /api/check ---');

  // Dapatkan URL dari request. Perlu di-construct ulang karena `req.url` di Vercel hanya path-nya
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Dapatkan parameter 'target' dari query string
  const target = url.searchParams.get('target');
  console.log(`Received 'target' parameter: ${target}`);
  
  // Periksa jika parameter 'target' tidak ada
  if (!target) {
    console.error("Error: Missing 'target' query parameter");
    // Gunakan objek `res` untuk mengirim respons
    res.status(400).json({ error: "Missing 'target' query parameter" });
    return;
  }

  // Pisahkan IP dan port
  const parts = target.split(':');
  if (parts.length !== 2) {
    console.error(`Error: Invalid target format for '${target}'`);
    res.status(400).json({ error: "Invalid target format. Expected 'ip:port'" });
    return;
  }
  const [ip, port] = parts;
  
  // URL API eksternal
  const PROXY_HEALTH_CHECK_API = "https://id1.foolvpn.me/api/v1/check";
  const apiUrl = `${PROXY_HEALTH_CHECK_API}?ip=${ip}:${port}`;
  
  // Log URL API eksternal yang akan dipanggil
  console.log(`Calling external API for health check: ${apiUrl}`);

  try {
    // Lakukan permintaan ke API eksternal.
    // Di lingkungan Vercel, `fetch` sudah tersedia secara global.
    const response = await fetch(apiUrl, {
      signal: AbortSignal.timeout(10000) // Timeout 10 detik untuk mencegah hang
    });

    // Periksa apakah respons dari API eksternal berhasil
    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      const errorBody = await response.text();
      
      // Log error jika respons tidak OK
      console.error(`External API responded with an error: Status ${status} - ${statusText}`);
      console.error(`Response body from external API: ${errorBody}`);

      res.status(status).json({ error: `External API error: ${statusText}` });
      return;
    }

    // Parse respons JSON jika berhasil
    const data = await response.json();
    
    // Log data yang berhasil diterima
    console.log('Successfully received data from external API:', data);
    
    // Kirim respons JSON yang berhasil ke klien
    res.status(200).json(data);

  } catch (error) {
    // Tangani error jaringan, timeout, atau parsing JSON
    console.error('An exception occurred during the fetch operation:', error);
    
    // Identifikasi jenis error untuk pesan yang lebih informatif
    if (error.name === 'AbortError') {
      console.error('Fetch request timed out.');
      res.status(504).json({ error: 'Request to external API timed out' });
      return;
    }
    
    console.error('Details:', error.message);
    res.status(500).json({ error: 'Failed to check proxy health' });
  }
}
