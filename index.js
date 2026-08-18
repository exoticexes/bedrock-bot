const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let onlinePlayers = new Map();
let isServerOnline = false;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/status', (req, res) => {
  if (isServerOnline && onlinePlayers.size === 0) {
    onlinePlayers.set('bot-id', 'Pis_Fakir');
  }

  res.json({
    online: isServerOnline,
    playerCount: onlinePlayers.size,
    players: Array.from(onlinePlayers.values())
  });
});

app.get('/', (req, res) => res.send('Bot ve API Aktif!'));

app.listen(port, () => {
  console.log(`[SISTEM] Web sunucu ${port} portunda baslatildi.`);
  startBot();
});

function startBot() {
  console.log('[BOT] Sunucuya baglanma denemesi baslatiliyor...');
  
  try {
    const client = bedrock.createClient({
      host: '46.4.101.93',
      port: 27056,
      username: 'Pis_Fakir',
      offline: true,
      connectTimeout: 10000
    });

    client.on('connect', () => {
      console.log('[BOT] Sunucuyla UDP baglantisi kuruldu, paketler bekleniyor...');
    });

    client.on('join', () => {
      isServerOnline = true;
      onlinePlayers.set('bot-id', 'Pis_Fakir');
      console.log('[BOT] Oyuna basariyla giris yapildi: Pis_Fakir');
    });

    client.on('player_list', (packet) => {
      if (!packet.records || !packet.records.records) return;
      const type = String(packet.records.type).toLowerCase();

      packet.records.records.forEach(p => {
        const name = p.username || p.name;
        const id = p.uuid || name;

        if (type.includes('add') && name) {
          onlinePlayers.set(id, name);
          console.log('[OYUNCU KATILDI]:', name);
        } else if (type.includes('remove') && id) {
          if (onlinePlayers.get(id) !== 'Pis_Fakir') {
            console.log('[OYUNCU AYRILDI]:', onlinePlayers.get(id));
            onlinePlayers.delete(id);
          }
        }
      });
    });

    client.on('disconnect', (reason) => {
      console.log('[BOT] Baglanti kesildi. Sebeb:', JSON.stringify(reason));
      isServerOnline = false;
      onlinePlayers.clear();
      setTimeout(startBot, 10000);
    });

    client.on('error', (err) => {
      console.log('[BOT HATA]:', err.message || err);
      isServerOnline = false;
      onlinePlayers.clear();
      setTimeout(startBot, 10000);
    });

  } catch (err) {
    console.log('[CRITICAL HATA]:', err);
    setTimeout(startBot, 10000);
  }
}
