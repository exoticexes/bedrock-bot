const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let activePlayers = new Set(['Pis_Fakir']);
let vurmaZamani = null;
let client = null;

function startBot() {
  // Eski bağlantı soketi varsa tamamen kapat ve sıfırla
  if (client) {
    try { client.close(); } catch (e) {}
    client = null;
  }

  console.log('[BOT] Baglaniliyor...');
  client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: 'Pis_Fakir',
    offline: true
  });

  client.on('join', () => {
    console.log('[BOT] Pis_Fakir oyuna basariyla girdi!');
    activePlayers.add('Pis_Fakir');
  });

  // 1. Tab listesinden oyuncu takibi (Pis_Fakir ve türevlerini listeden hariç tutar)
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;
    packet.records.records.forEach(r => {
      if (r.username && !r.username.startsWith('Pis_Fakir')) {
        if (packet.records.type === 'add') {
          activePlayers.add(r.username);
          console.log('[OYUNCU KATILDI - TAB]:', r.username);
        }
        if (packet.records.type === 'remove') {
          activePlayers.delete(r.username);
          console.log('[OYUNCU AYRILDI - TAB]:', r.username);
        }
      }
    });
  });

  // 2. Chat / Sistem bildiriminden oyuncu takibi
  client.on('text', (packet) => {
    const msg = packet.message || '';
    const pName = packet.parameters ? packet.parameters[0] : null;

    if (pName && !pName.startsWith('Pis_Fakir')) {
      if (msg.includes('joined') || msg.includes('katildi')) {
        activePlayers.add(pName);
        console.log('[OYUNCU KATILDI - CHAT]:', pName);
      }
      if (msg.includes('left') || msg.includes('ayrildi')) {
        activePlayers.delete(pName);
        console.log('[OYUNCU AYRILDI - CHAT]:', pName);
      }
    }
  });

  // 3. Farm Komut Dinleyicisi
  client.on('text', (packet) => {
    let rawText = packet.message || '';
    if (packet.parameters && Array.isArray(packet.parameters)) {
      rawText += ' ' + packet.parameters.join(' ');
    }

    const cleanMsg = rawText.replace(/§[0-9a-fk-or]/gi, '').toLowerCase();

    // Farm Başlat
    if (cleanMsg.includes('!farm')) {
      if (vurmaZamani) clearInterval(vurmaZamani);
      console.log('[FARM] Bot kılıç sallamaya başladı.');

      vurmaZamani = setInterval(() => {
        try {
          if (client) {
            client.queue('animate', {
              action_id: 1, // Kılıç sallama
              runtime_entity_id: client.entityId
            });
          }
        } catch (e) {
          console.log('[FARM HATA]:', e.message);
        }
      }, 500);
    }

    // Farm Durdur
    if (cleanMsg.includes('!dur')) {
      if (vurmaZamani) {
        clearInterval(vurmaZamani);
        vurmaZamani = null;
        console.log('[FARM] Bot vurmayı durdurdu.');
      }
    }
  });

  client.on('disconnect', () => {
    if (vurmaZamani) { clearInterval(vurmaZamani); vurmaZamani = null; }
    console.log('[BOT] Baglanti kesildi, sunucunun eski oturumu düşürmesi bekleniyor (15sn)...');
    setTimeout(startBot, 15000); // Sunucunun hayalet oturumu temizlemesi için 15sn bekleme
  });

  client.on('error', (err) => {
    if (vurmaZamani) { clearInterval(vurmaZamani); vurmaZamani = null; }
    console.log('[BOT HATA]:', err.message || err);
    setTimeout(startBot, 15000);
  });
}

startBot();

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
      players: Array.from(activePlayers)
    });
  } catch (err) {
    res.json({ online: true, playerCount: activePlayers.size, players: Array.from(activePlayers) });
  }
});

app.get('/', (req, res) => res.send('API ve Bot Aktif!'));
app.listen(port);
