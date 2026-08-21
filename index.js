const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let activePlayers = new Set(['Pis_Fakir']);
let vurmaZamani = null;
let bakisYawi = 270; // Botun bakacağı varsayılan yön açısı

function startBot() {
  console.log('[BOT] Baglaniliyor...');
  const client = bedrock.createClient({
    host: '46.4.101.93',
    port: 27056,
    username: 'Pis_Fakir',
    offline: true
  });

  client.on('join', () => {
    console.log('[BOT] Pis_Fakir oyuna basariyla girdi!');
    activePlayers.add('Pis_Fakir');
  });

  // 1. Tab listesinden isim yakalama
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;
    packet.records.records.forEach(r => {
      if (r.username && r.username !== 'Pis_Fakir') {
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

  // 2. Chat / Sistem bildiriminden isim yakalama
  client.on('text', (packet) => {
    const msg = packet.message || '';
    const pName = packet.parameters ? packet.parameters[0] : null;

    if (pName && pName !== 'Pis_Fakir') {
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

  // 3. Farm Komutları ve Yön Kontrolü
  client.on('text', (packet) => {
    let chatContent = packet.message || '';
    if (packet.parameters && packet.parameters[1]) {
      chatContent = packet.parameters[1];
    }

    const lowerMsg = chatContent.trim().toLowerCase();

    // Sohbet üzerinden yön değiştirme
    if (lowerMsg === '!sol') bakisYawi = (bakisYawi + 270) % 360;
    if (lowerMsg === '!sag') bakisYawi = (bakisYawi + 90) % 360;
    if (lowerMsg === '!don') bakisYawi = (bakisYawi + 180) % 360;

    if (lowerMsg === '!farm') {
      if (vurmaZamani) clearInterval(vurmaZamani);
      console.log('[FARM] Bot kılıç sallamaya başladı.');
      
      vurmaZamani = setInterval(() => {
        // Botun vücudunu ve kafasını belirlenen açıya kilitler
        client.queue('move_player', {
          runtime_entity_id: client.entityId,
          position: client.pos || { x: 0, y: 0, z: 0 },
          pitch: 20,            // Hafif aşağı bakış (Slab altına/huninin üstüne vurması için)
          yaw: bakisYawi,       // Ayarlanan bakış açısı
          head_yaw: bakisYawi,  // Kafa açısı
          mode: 'normal',
          on_ground: true,
          riding_entity_runtime_id: 0,
          teleport_cause: 0,
          teleport_source_entity_type: 0
        });

        // Kılıç sallama
        client.queue('animate', {
          action_id: 1,
          runtime_entity_id: client.entityId
        });
      }, 500);
    }

    if (lowerMsg === '!dur') {
      if (vurmaZamani) {
        clearInterval(vurmaZamani);
        vurmaZamani = null;
        console.log('[FARM] Bot vurmayı durdurdu.');
      }
    }
  });

  client.on('disconnect', () => {
    if (vurmaZamani) { clearInterval(vurmaZamani); vurmaZamani = null; }
    console.log('[BOT] Baglanti kesildi, tekrar deneniyor...');
    setTimeout(startBot, 10000);
  });

  client.on('error', (err) => {
    if (vurmaZamani) { clearInterval(vurmaZamani); vurmaZamani = null; }
    console.log('[BOT HATA]:', err.message || err);
    setTimeout(startBot, 10000);
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
