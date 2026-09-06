const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Tüm sunucu oyuncularını API için ortak bir yerde tutuyoruz
let allActivePlayers = new Set();

// BOT FABRİKASI (Her bot kendi ismine ve bağımsız bağlantısına sahip olur)
function startBot(botAdi) {
  console.log(`[BOT - ${botAdi}] Baglaniliyor...`);
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: botAdi,
    offline: true
  });

  client.on('join', () => {
    console.log(`[BOT - ${botAdi}] Oyuna basariyla girdi!`);
    allActivePlayers.add(botAdi);
  });

  // 1. Tab listesinden isim yakalama ve loga basma
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;
    packet.records.records.forEach(r => {
      if (r.username && r.username !== botAdi) {
        if (packet.records.type === 'add') {
          allActivePlayers.add(r.username);
          console.log(`[${botAdi} - OYUNCU KATILDI - TAB]:`, r.username);
        }
        if (packet.records.type === 'remove') {
          allActivePlayers.delete(r.username);
          console.log(`[${botAdi} - OYUNCU AYRILDI - TAB]:`, r.username);
        }
      }
    });
  });

  // 2. Chat / Sistem bildiriminden isim yakalama ve loga basma
  client.on('text', (packet) => {
    const msg = packet.message || '';
    const pName = packet.parameters ? packet.parameters[0] : null;

    if (pName && pName !== botAdi) {
      if (msg.includes('joined') || msg.includes('katildi')) {
        allActivePlayers.add(pName);
        console.log(`[${botAdi} - OYUNCU KATILDI - CHAT]:`, pName);
      }
      if (msg.includes('left') || msg.includes('ayrildi')) {
        allActivePlayers.delete(pName);
        console.log(`[${botAdi} - OYUNCU AYRILDI - CHAT]:`, pName);
      }
    }
  });

  client.on('disconnect', () => {
    console.log(`[BOT - ${botAdi}] Baglanti kesildi, tekrar deneniyor...`);
    setTimeout(() => startBot(botAdi), 10000);
  });

  client.on('error', (err) => {
    console.log(`[BOT HATA - ${botAdi}]:`, err.message || err);
    setTimeout(() => startBot(botAdi), 10000);
  });
}

// İKİ BOTU DA AYNI ANDA BAŞLATIYORUZ
startBot('Pis_Fakir');
startBot('Zengin');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/status', async (req, res) => {
  try {
    const response = await fetch('https://api.mcstatus.io/v2/status/bedrock/46.4.101.93:27056');
    const data = await response.json();
    const count = data.online ? data.players.online : 0;

    res.json({
      online: data.online,
      playerCount: count,
      players: Array.from(allActivePlayers)
    });
  } catch (err) {
    res.json({ online: true, playerCount: allActivePlayers.size, players: Array.from(allActivePlayers) });
  }
});

app.get('/', (req, res) => res.send('API ve Cift Bot Aktif!'));
app.listen(port);
