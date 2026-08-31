export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('image');
    if (!file) return new Response(JSON.stringify({ error: 'No image file provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (!file.type.startsWith('image/')) return new Response(JSON.stringify({ error: 'File must be an image' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (file.size > 5 * 1024 * 1024) return new Response(JSON.stringify({ error: 'Image must be under 5MB' }), { status: 413, headers: { 'Content-Type': 'application/json' } });

    const buf = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${context.env.IMGBB_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ image: base64 }),
    });

    const imgbbData = await imgbbRes.json();
    if (!imgbbData.success) {
      console.error('ImgBB error:', imgbbData);
      return new Response(JSON.stringify({ error: 'Image hosting failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ url: imgbbData.data.url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Upload error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
