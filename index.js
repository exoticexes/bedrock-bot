const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot aktif.'));
app.listen(port, () => console.log('Sunucu calisiyor.'));

function startBot() {
  console.log('Sunucuya baglaniliyor...');
  const client = bedrock.createClient({
    host: '46.4.101.93', 
    port: 27056,        
    username: 'Mert_Server', // İsmi değiştirdik
    offline: true,
    version: '1.26.44'       // Sürümü zorunlu kıldık
  });

  client.on('join', () => console.log('Basariyla girildi!'));
  client.on('disconnect', (packet) => {
    console.log('Baglanti reddedildi. Packet:', packet);
    // Hata sürerse 30 saniye bekle
    setTimeout(startBot, 30000); 
  });
  client.on('error', (err) => {
    console.log('Hata:', err);
    setTimeout(startBot, 30000);
  });
}

startBot();
