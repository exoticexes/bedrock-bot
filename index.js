const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let allActivePlayers = new Set();

function startBot(botAdi) {
  console.log(`[BOT - ${botAdi}] Baglaniliyor...`);
  
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: botAdi,
    offline: true,
    // Sunucu geç yanıt verirse timeout süresini uzatıyoruz
    connectTimeout: 30000 
  });

  client.on('join', () => {
    console.log(`[BOT - ${botAdi}] Oyuna basariyla girdi!`);
    allActivePlayers.add(botAdi);
  });

  client.on('disconnect', (packet) => {
    console.log(`[BOT - ${botAdi}] Baglanti kesildi:`, packet);
    setTimeout(() => startBot(botAdi), 15000);
  });

  client.on('error', (err) => {
    console.log(`[BOT HATA - ${botAdi}]:`, err.message || err);
    setTimeout(() => startBot(botAdi), 15000);
  });
}

// Önce sadece tek botla (Pis_Fakir) test edelim, sorunsuz girerse Zengin'i de açarız
startBot('Pis_Fakir');
// startBot('Zengin'); 

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/status', (req, res) => {
  res.json({ online: true, playerCount: allActivePlayers.size, players: Array.from(allActivePlayers) });
});

app.get('/', (req, res) => res.send('API Aktif!'));
app.listen(port);
