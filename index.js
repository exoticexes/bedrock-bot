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
    skipPing: true // Ping kontrolünü atlayıp doğrudan sunucuya baglanir
  });

  client.on('join', () => {
    console.log(`[BOT - ${botAdi}] Oyuna basariyla girdi!`);
    allActivePlayers.add(botAdi);
  });

  // Tab listesi takibi
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;
    packet.records.records.forEach(r => {
      if (r.username && r.username !== botAdi) {
        if (packet.records.type === 'add') allActivePlayers.add(r.username);
        if (packet.records.type === 'remove') allActivePlayers.delete(r.username);
      }
    });
  });

  // Chat takibi
  client.on('text', (packet) => {
    const msg = packet.message || '';
    const pName = packet.parameters ? packet.parameters[0] : null;

    if (pName && pName !== botAdi) {
      if (msg.includes('joined') || msg.includes('katildi')) allActivePlayers.add(pName);
      if (msg.includes('left') || msg.includes('ayrildi')) allActivePlayers.delete(pName);
    }
  });

  client.on('disconnect', () => {
    console.log(`[BOT - ${botAdi}] Baglanti kesildi, 15sn sonra tekrar deneniyor...`);
    setTimeout(() => startBot(botAdi), 15000);
  });

  client.on('error', (err) => {
    console.log(`[BOT HATA - ${botAdi}]:`, err.message || err);
    setTimeout(() => startBot(botAdi), 15000);
  });
}

// İki botu da baslatiyoruz
startBot('Pis_Fakir');
startBot('Zengin');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/status', (req, res) => {
  res.json({ online: true, playerCount: allActivePlayers.size, players: Array.from(allActivePlayers) });
});

app.get('/', (req, res) => res.send('API ve Cift Bot Aktif!'));
app.listen(port);
