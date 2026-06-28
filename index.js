require('dotenv').config();
const schedule = require('node-schedule');
const axios = require('axios');

const wahaUrl = process.env.WAHA_URL;
const chatId = process.env.NO_WA;
const sessionName = process.env.SESSION_NAME;
const apiKey = process.env.API_KEY; 

async function sendNotificationAlert(message){
  const pesan = `Pesan log:\n ${message}`;
  try {
    await axios.post(wahaUrl, {
      chatId: chatId,
      text: pesan,
      session: sessionName
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      }
    });
  } catch (e) {
    console.error('[Gagal] tidak dapat mengirim pesan wa : ', e.message);
  } 
}

async function sendNotification(name) {
  try {
    const pesan = `Waktunya shalat *${name}* telah tiba. Selamat menunaikan ibadah!`;
    await axios.post(wahaUrl, {
      chatId: chatId,
      text: pesan,
      session: sessionName
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      }
    });

    console.log(`[Berhasil] Notifikasi ${name} terkirim`);
  } catch (e) {
    console.error('[Gagal] tidak dapat mengirim pesan wa : ', e.message);
  }
}

async function setupJadwalHariIni() {
  const setupJadwal = [];
  try {
      const now = new Date();
      const hariIni = now.toLocaleDateString('en-CA'); // format YYYY-MM-DD sesuai locale
      const tahun = hariIni.split("-")[0];

      // Mengambil jadwal (Ganti '1301' dengan ID Kota Anda)
      const urlAPI = `https://api.myquran.com/v3/sholat/jadwal/d6baf65e0b240ce177cf70da146c8dc8/today?tz=Asia%2FJakarta`;
      
      const response = await axios.get(urlAPI);
      
      const jadwal = response.data.data.jadwal[hariIni];

      const daftarSholat = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

      console.log(`\nMenyiapkan alarm sholat untuk tanggal: ${jadwal.tanggal}`);
      setupJadwal.push(`Menyiapkan alarm sholat untuk tanggal: ${jadwal.tanggal}\n`)

      // Buat jadwal untuk masing-masing waktu sholat
      daftarSholat.forEach(waktu => {
          const jamMenit = jadwal[waktu]; // Menghasilkan format "HH:MM"
          const [jam, menit] = jamMenit.split(':');

          // Buat objek waktu spesifik untuk hari ini
          const waktuEksekusi = new Date(tahun, hariIni.split("-")[1] - 1, hariIni.split("-")[2], jam, menit, '00');

          // Pastikan waktu belum terlewat (jika script dijalankan siang, subuh tidak perlu dijadwalkan)
          if (new Date() <= waktuEksekusi) {
              schedule.scheduleJob(waktuEksekusi, function() {
                  sendNotification(waktu);
              });
              console.log(`- Tugas disiapkan: ${waktu} pada jam ${jamMenit}`);
              setupJadwal.push(`- Tugas disiapkan: ${waktu} pada jam ${jamMenit}\n`);
          } else {
              console.log(`- Tugas dilewati: ${waktu} (waktu sudah terlewat)`);
              setupJadwal.push(`- Tugas dilewati: ${waktu} (waktu sudah terlewat)\n`);
          }
      });

  } catch (error) {
      console.error('Gagal mengambil data jadwal sholat:', error.message);
      setupJadwal.push('Gagal mengambil data jadwal sholat:', error.message, '\n');
  }
  sendNotificationAlert(setupJadwal);
}

setupJadwalHariIni();

schedule.scheduleJob('1 0 * * *', function() {
    console.log('Pergantian hari, menarik ulang jadwal sholat...');
    sendNotificationAlert('Pergantian hari, menarik ulang jadwal sholat...');
    setupJadwalHariIni();
});

console.log('Sistem Automasi Node.js berjalan...');