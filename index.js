const bedrock = require('bedrock-protocol');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Bot 7/24 Aktif!'));
app.listen(port, () => console.log('Web sunucusu hazir.'));

function startBot() {
  console.log('Sunucuya baglaniliyor...');
  const client = bedrock.createClient({
    host: '46.4.101.93', // Örn: ornek.aternos.me
    port: 27056,            // Sunucunun Bedrock portu
    username: 'AFK_Bot_724',
    offline: true
  });

  client.on('join', () => console.log('Bot oyuna girdi!'));
  client.on('disconnect', () => setTimeout(startBot, 10000));
  client.on('error', () => setTimeout(startBot, 10000));
}

startBot();
