const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/status', async (req, res) => {
  try {
    // Doğrudan mcstatus servisinden sunucu durumunu çekiyoruz
    const response = await fetch('https://api.mcstatus.io/v2/status/bedrock/46.4.101.93:27056');
    const data = await response.json();

    if (data.online) {
      const playerList = data.players.list ? data.players.list.map(p => p.name) : [];
      
      res.json({
        online: true,
        playerCount: data.players.online,
        players: playerList
      });
    } else {
      res.json({ online: false, playerCount: 0, players: [] });
    }
  } catch (err) {
    res.json({ online: false, playerCount: 0, players: [] });
  }
});

app.get('/', (req, res) => res.send('API Aktif!'));

app.listen(port, () => {
  console.log(`[SISTEM] API ${port} portunda baslatildi.`);
});
