const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// 1. PIS_FAKIR BOTUNU SUNUCUDA TUTAN KISIM
function startBot() {
  console.log('[BOT] Sunucuya giris yapiliyor...');
  
  try {
    const client = bedrock.createClient({
      host: '46.4.101.93',
      port: 27056,
      username: 'Pis_Fakir',
      offline: true
    });

    client.on('join', () => {
      console.log('[BOT] Pis_Fakir oyuna basariyla girdi!');
    });

    client.on('disconnect', () => {
      console.log('[BOT] Sunucudan dusuldu, tekrar baglaniliyor...');
      setTimeout(startBot, 10000);
    });

    client.on('error', (err) => {
      console.log('[BOT HATA]:', err.message || err);
      setTimeout(startBot, 10000);
    });
  } catch (e) {
    console.log('[BOT KRITIK HATA]:', e);
    setTimeout(startBot, 10000);
  }
}

startBot();

// 2. WEB SITESI ICIN CANLI OYUNCU BİLGİSİ CEKEN API
app.get('/api/status', async (req, res) => {
  try {
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

app.get('/', (req, res) => res.send('Bot ve API Aktif!'));

app.listen(port, () => {
  console.log(`[SISTEM] Web sunucu ${port} portunda baslatildi.`);
});
