const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot aktif.'));
app.listen(port, () => console.log('Web sunucusu calisiyor.'));

function startBot() {
  console.log('Sunucuya baglaniliyor...');

  try {
    const client = bedrock.createClient({
      host: '46.4.101.93',
      port: 27056,
      username: 'Mert_Server',
      offline: true,
      skipPing: false // Sürümü otomatik tespit etmesi için ping atmasını sağlıyoruz
    });

    client.on('join', () => console.log('Basariyla girildi!'));
    client.on('disconnect', (packet) => {
      console.log('Baglanti koptu:', packet);
      setTimeout(startBot, 15000);
    });
    client.on('error', (err) => {
      console.log('Hata:', err.message || err);
      setTimeout(startBot, 15000);
    });
  } catch (e) {
    console.log('Baslatma hatasi:', e.message);
    setTimeout(startBot, 15000);
  }
}

startBot();
