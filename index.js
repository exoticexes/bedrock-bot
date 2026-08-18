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
  // Bot aktifse listede Pis_Fakir her zaman dursun
  if (isServerOnline && !onlinePlayers.has('bot-id')) {
    onlinePlayers.set('bot-id', 'Pis_Fakir');
  }

  res.json({
    online: isServerOnline,
    playerCount: onlinePlayers.size,
    players: Array.from(onlinePlayers.values())
  });
});

app.get('/', (req, res) => res.send('Bot ve API Aktif!'));
app.listen(port);

function startBot() {
  console.log('Sunucuya baglaniliyor...');
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: 'Pis_Fakir',
    offline: true
  });

  client.on('join', () => {
    isServerOnline = true;
    onlinePlayers.set('bot-id', 'Pis_Fakir');
    console.log('>>> Bot sunucuya girdi: Pis_Fakir');
  });

  // 1. Yontem: Oyuncu listesi paketlerini dinle (name ve username kontrollu)
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;
    const type = String(packet.records.type).toLowerCase();

    packet.records.records.forEach(p => {
      const name = p.username || p.name;
      const id = p.uuid || name;

      if (type.includes('add') && name) {
        onlinePlayers.set(id, name);
        console.log('>>> [Oyuncu Katildi]:', name);
      } else if (type.includes('remove') && id) {
        if (onlinePlayers.get(id) !== 'Pis_Fakir') {
          console.log('>>> [Oyuncu Ayrildi]:', onlinePlayers.get(id));
          onlinePlayers.delete(id);
        }
      }
    });
  });

  // 2. Yontem: Sohbet / Sistem mesajlarindan katilimlari yakala
  client.on('text', (packet) => {
    const msg = packet.message || '';
    if (msg.includes('joined the game') || msg.includes('oyuna katildi')) {
      const name = msg.split(' ')[0];
      if (name && name !== 'Pis_Fakir') {
        onlinePlayers.set(name, name);
        console.log('>>> [Sistemden Yakalandi]:', name);
      }
    }
  });

  client.on('disconnect', () => {
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 15000);
  });

  client.on('error', (err) => {
    console.log('Bot Hata:', err);
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 15000);
  });
}

startBot();
