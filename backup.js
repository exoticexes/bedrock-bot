const { exec } = require('child_process');
const fs = require('fs');

// AYARLAR
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1539668875451437156/srXuzSAxTEZ9vg0-VKOFoFokFEDdFLBefkbrbwycBgW1cuUFsfJUkeDuhYp_Zik7oc8m'; // Discord Webhook URL
const WORLD_PATH = './worlds';                   // Dünya klasörünün yolu
const BACKUP_FILE = 'yedek.zip';

function otomatikYedekAl() {
  console.log('[YEDEK] 6 saatlik otomatik yedekleme başlatıldı...');

  // Dünya klasörünü zip dosyasına dönüştürür
  exec(`zip -r ${BACKUP_FILE} ${WORLD_PATH}`, (err) => {
    if (err) return console.error('[YEDEK HATA] Zip oluşturulamadı:', err);

    // Zip dosyasını Discord kanalına yükler
    const curlCommand = `curl -F "file=@${BACKUP_FILE}" -F "payload_json={\\"content\\": \\"📦 **6 Saatlik Otomatik Sunucu Yedeği!**\\\\n📅 Tarih: ${new Date().toLocaleString('tr-TR')}\\"}" ${WEBHOOK_URL}`;

    exec(curlCommand, (curlErr) => {
      if (curlErr) {
        console.error('[YEDEK HATA] Discord yükleme hatası:', curlErr);
      } else {
        console.log('[YEDEK BAŞARILI] Yediğiniz Discord kanalına gönderildi!');
      }

      // İşlem bitince geçici zip dosyasını temizler
      if (fs.existsSync(BACKUP_FILE)) fs.unlinkSync(BACKUP_FILE);
    });
  });
}

// 6 Saat = 21.600.000 milisaniye
const ALTI_SAAT = 6 * 60 * 60 * 1000;

// Proje/dosya ilk çalıştığında hemen bir yedek alır
otomatikYedekAl();

// Sonrasında her 6 saatte bir tekrarlar
setInterval(otomatikYedekAl, ALTI_SAAT);
