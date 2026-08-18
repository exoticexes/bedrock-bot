const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let isBotConnected = false;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// AFK Bot Sunucuda 7/24 Kalır
function startBot() {
  console.log('[BOT] Sunucuya baglaniliyor...');
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: 'Pis_Fakir',
    offline: true
  });

  client.on('join', () => {
    isBotConnected = true;
    console.log('[BOT] Pis_Fakir oyunda!');
  });

  client.on('disconnect', () => {
    isBotConnected = false;
    setTimeout(startBot, 10000);
  });

  client.on('error', () => {
    isBotConnected = false;
    setTimeout(startBot, 10000);
  });
}

startBot();

// API: Oyuncu sayisini dogrudan RakNet Ping ile anlik ceker
app.get('/api/status', async (req, res) => {
  try {
    const pingResult = await bedrock.ping({
      host: '46.4.101.93',
      port: 27056,
      timeout: 3000
    });

    const realPlayerCount = parseInt(pingResult.playersOnline || 0);

    res.json({
      online: true,
      playerCount: realPlayerCount,
      players: realPlayerCount > 0 ? ['Pis_Fakir', ...Array(Math.max(0, realPlayerCount - 1)).fill('Aktif Oyuncu')] : []
    });
  } catch (err) {
    // Ping zaman asimina ugrarsa bot durumuna gore cevap ver
    res.json({
      online: isBotConnected,
      playerCount: isBotConnected ? 1 : 0,
      players: isBotConnected ? ['Pis_Fakir'] : []
    });
  }
});

app.get('/', (req, res) => res.send('Bot ve API Aktif!'));
app.listen(port);
