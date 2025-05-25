import fetch from 'node-fetch';

async function getNgrokUrl() {
  try {
    const res = await fetch('http://ngrok:4040/api/tunnels');
    const data = await res.json();
    const httpsTunnel = data.tunnels.find(t => t.proto === 'https');
    return httpsTunnel ? httpsTunnel.public_url : null;
  } catch (e) {
    console.error('Error Url Catching:', e);
    return null;
  }
}


app.get('/ngrok-url', async (req, res) => {
  const url = await getNgrokUrl();
  if(url) {
    res.json({ url });
  } else {
    res.status(500).json({ error: 'Ngrok URL non disponible' });
  }
});
