const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Uygulamanın anında çökmesini engellemek için genel hata yakalayıcılar
process.on('uncaughtException', (err) => {
  console.error('[GENEL HATA]:', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[SÖZDİRİM HATASI]:', reason);
});

let allActivePlayers = new Set();

function startBot(botAdi) {
  console.log(`[BOT - ${botAdi}] Baglaniliyor...`);
  
  try {
    const client = bedrock.createClient({
      host: '46.4.101.93',
      port: 27056,
      username: botAdi,
      offline: true,
      skipPing: true
    });

    client.on('join', () => {
      console.log(`[BOT - ${botAdi}] Oyuna basariyla girdi!`);
      allActivePlayers.add(botAdi);
    });

    client.on('player_list', (packet) => {
      if (!packet.records || !packet.records.records) return;
      packet.records.records.forEach(r => {
        if (r.username && r.username !== botAdi) {
          if (packet.records.type === 'add') allActivePlayers.add(r.username);
          if (packet.records.type === 'remove') allActivePlayers.delete(r.username);
        }
      });
    });

    client.on('text', (packet) => {
      const msg = packet.message || '';
      const pName = packet.parameters ? packet.parameters[0] : null;

      if (pName && pName !== botAdi) {
        if (msg.includes('joined') || msg.includes('katildi')) allActivePlayers.add(pName);
        if (msg.includes('left') || msg.includes('ayrildi')) allActivePlayers.delete(pName);
      }
    });

    client.on('disconnect', (packet) => {
      console.log(`[BOT - ${botAdi}] Baglanti kesildi (${packet?.reason || 'Sebep yok'}), tekrar deneniyor...`);
      setTimeout(() => startBot(botAdi), 10000);
    });

    client.on('error', (err) => {
      console.log(`[BOT HATA - ${botAdi}]:`, err.message || err);
      setTimeout(() => startBot(botAdi), 10000);
    });

  } catch (e) {
    console.error(`[BOT BASLATMA HATASI - ${botAdi}]:`, e.message);
    setTimeout(() => startBot(botAdi), 10000);
  }
}

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

app.listen(port, () => console.log(`Sunucu ${port} portunda baslatildi.`));
