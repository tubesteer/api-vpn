import { NextResponse } from 'next/server';

// Fungsi handler untuk permintaan GET
export async function GET(request) {
  // Dapatkan URL dari permintaan masuk
  const url = new URL(request.url);
  
  // Dapatkan nilai dari parameter query 'target'
  const target = url.searchParams.get('target');
  
  // Cek apakah parameter 'target' ada
  if (!target) {
    return NextResponse.json({ error: "Missing 'target' query parameter" }, { status: 400 });
  }

  // Pisahkan IP dan port
  const [ip, port] = target.split(':');
  if (!ip || !port) {
    return NextResponse.json({ error: "Invalid target format. Expected 'ip:port'" }, { status: 400 });
  }

  // URL API eksternal untuk pemeriksaan kesehatan
  const PROXY_HEALTH_CHECK_API = "https://id1.foolvpn.me/api/v1/check";
  const apiUrl = `${PROXY_HEALTH_CHECK_CHECK_API}?ip=${ip}:${port}`;

  try {
    // Lakukan permintaan ke API eksternal
    const response = await fetch(apiUrl);

    // Cek apakah respons berhasil
    if (!response.ok) {
      // Jika respons tidak berhasil, kembalikan error dari API eksternal
      const errorText = await response.text();
      return NextResponse.json({ error: `External API error: ${errorText}` }, { status: response.status });
    }

    // Parse respons JSON
    const data = await response.json();
    
    // Kembalikan data yang diterima dari API
    return NextResponse.json(data);

  } catch (error) {
    // Tangani error jaringan atau lainnya
    console.error('Failed to fetch health check API:', error);
    return NextResponse.json({ error: 'Failed to check proxy health' }, { status: 500 });
  }
}
