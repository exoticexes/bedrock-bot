const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot 7/24 Aktif!'));
app.listen(port, () => console.log('Web sunucusu hazir.'));

function startBot() {
  console.log('Sunucuya baglaniliyor...');
  const client = bedrock.createClient({
    host: 'mertsel.mc.mcfreehost.com', // Sunucu adresin
    port: 27056,                       // Portun
    username: 'AFK_Bot_724',
    offline: true,                     // Sunucu Online Mode kapalıysa bu true kalmalı
    version: '1.26.44'                 // Kütüphane sürümü 1.26.44 kabul eder, bu değer yeterlidir
  });

  client.on('join', () => console.log('Bot oyuna basariyla girdi!'));
  client.on('disconnect', (packet) => {
    console.log('Baglanti koptu. Sunucu ayarlarini (Online Mode/Whitelist) kontrol et!', packet);
    setTimeout(startBot, 10000); // 10 saniye sonra tekrar dene
  });
  client.on('error', (err) => {
    console.log('Hata:', err);
    setTimeout(startBot, 10000);
  });
}

startBot();
