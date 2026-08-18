const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let onlinePlayers = new Map(); // Oyuncuları ID (UUID) ile tutacağız
let isServerOnline = false;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/status', (req, res) => {
  res.json({
    online: isServerOnline,
    playerCount: onlinePlayers.size,
    players: Array.from(onlinePlayers.values())
  });
});

app.get('/', (req, res) => res.send('Bot aktif.'));
app.listen(port);

function startBot() {
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: 'Pis_Fakir', // Botun adı
    offline: true
  });

  client.on('join', () => {
    isServerOnline = true;
    console.log('[BOT] Sunucuya girdi.');
  });

  // TEK GERÇEK YÖNTEM: Player List paketleri
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;

    packet.records.records.forEach(record => {
      // Botun kendisini listeye eklemiyoruz
      if (record.username === 'Pis_Fakir') return;

      if (packet.records.type === 'add') {
        onlinePlayers.set(record.uuid, record.username);
        console.log('[+] Eklendi:', record.username);
      } else if (packet.records.type === 'remove') {
        onlinePlayers.delete(record.uuid);
        console.log('[-] Silindi:', record.username);
      }
    });
  });

  client.on('disconnect', () => {
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 10000);
  });

  client.on('error', () => {
    isServerOnline = false;
    onlinePlayers.clear();
    setTimeout(startBot, 10000);
  });
}

startBot();
