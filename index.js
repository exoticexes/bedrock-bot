const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let activePlayers = new Set(['Pis_Fakir']);
let vurmaZamani = null;
let client = null;
let hedefler = new Set(); 
let botPos = { x: 0, y: 0, z: 0 }; // Botun gerçek konumu

function startBot() {
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
    hedefler.clear(); 
  });

  // SUNUCUDAN GERÇEK KONUMU YAKALAMA (Vuruşun kabul edilmesi için ŞART)
  client.on('move_player', (packet) => {
    if (packet.runtime_entity_id === client.entityId && packet.position) {
      botPos = packet.position;
    }
  });

  client.on('start_game', (packet) => {
    if (packet.player_position) {
      botPos = packet.player_position;
    }
  });

  // RADAR: Etraftaki varlıkları listeye ekle
  client.on('add_entity', (packet) => {
    const entityId = packet.runtime_entity_id || packet.runtime_id;
    if (entityId) hedefler.add(entityId);
  });

  // RADAR: Uzaklaşan/ölen varlıkları listeden sil
  client.on('remove_entity', (packet) => {
    const entityId = packet.entity_id_self || packet.runtime_entity_id;
    if (entityId) hedefler.delete(entityId);
  });

  // Tab listesinden oyuncu takibi
  client.on('player_list', (packet) => {
    if (!packet.records || !packet.records.records) return;
    packet.records.records.forEach(r => {
      if (r.username && !r.username.startsWith('Pis_Fakir')) {
        if (packet.records.type === 'add') activePlayers.add(r.username);
        if (packet.records.type === 'remove') activePlayers.delete(r.username);
      }
    });
  });

  // Chat / Sistem bildiriminden oyuncu takibi
  client.on('text', (packet) => {
    const msg = packet.message || '';
    const pName = packet.parameters ? packet.parameters[0] : null;

    if (pName && !pName.startsWith('Pis_Fakir')) {
      if (msg.includes('joined') || msg.includes('katildi')) activePlayers.add(pName);
      if (msg.includes('left') || msg.includes('ayrildi')) activePlayers.delete(pName);
    }

    let rawText = packet.message || '';
    if (packet.parameters && Array.isArray(packet.parameters)) {
      rawText += ' ' + packet.parameters.join(' ');
    }

    const cleanMsg = rawText.replace(/§[0-9a-fk-or]/gi, '').toLowerCase();

    // Farm Başlat
    if (cleanMsg.includes('!farm')) {
      if (vurmaZamani) clearInterval(vurmaZamani);
      console.log('[FARM] Radar aktif! Gerçek konum ile saldırılıyor.');

      vurmaZamani = setInterval(() => {
        if (!client) return;

        // Görsel animasyon (Kol sallama)
        try {
          client.queue('animate', {
            action_id: 1, 
            runtime_entity_id: client.entityId
          });
        } catch(e) {}

        // Eğer bot konumu aldıysa hedeflere vur
        if (hedefler.size > 0 && botPos.x !== 0) {
          hedefler.forEach(hedefID => {
            try {
              client.queue('inventory_transaction', {
                transaction: {
                  legacy: { legacy_request_id: 0, legacy_transactions: [] },
                  transaction_type: 'item_use_on_entity',
                  transaction_data: {
                    action_type: 'attack',
                    runtime_entity_id: hedefID,
                    hotbar_slot: 0,
                    item_in_hand: { network_id: 0 },
                    player_pos: botPos, // Hile korumasını aşmak için gerçek koordinat
                    click_pos: botPos   
                  }
                }
              });
            } catch(e) {}
          });
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
    console.log('[BOT] Baglanti kesildi, tekrar deneniyor (15sn)...');
    setTimeout(startBot, 15000);
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
