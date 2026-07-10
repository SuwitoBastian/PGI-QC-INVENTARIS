# PGI-QC-INVENTARIS

## Deskripsi

PGI-QC-INVENTARIS adalah aplikasi berbasis **Node.js**, **Express**, dan **SQLite** yang dikembangkan untuk membantu proses **Quality Control (QC) inventaris perangkat IT**.

Aplikasi ini mempermudah proses import data inventaris, pelaksanaan QC melalui WhatsApp Bot, pembacaan barcode dan OCR, monitoring progres QC melalui dashboard, serta export hasil QC ke file Excel.

---

# Fitur

* Dashboard QC Inventaris
* Multi Company (PGI & PEI)
* Import Data Inventaris dari Excel
* Export Hasil QC ke Excel
* WhatsApp Bot untuk QC
* Scan Barcode Inventaris
* OCR Nomor Inventaris
* Status QC (DONE, REJECT, PENDING)
* Batch Management
* Statistik QC
* Riwayat QC
* SQLite Database

---

# Teknologi

* Node.js
* Express.js
* SQLite (better-sqlite3)
* EJS
* Bootstrap 5
* whatsapp-web.js
* Jimp
* ZXing Barcode Library
* ExcelJS

---

# Instalasi

## 1. Clone Repository

```bash
git clone https://github.com/USERNAME/PGI-QC-INVENTARIS.git
```

## 2. Masuk ke Folder Project

```bash
cd PGI-QC-INVENTARIS
```

## 3. Install Dependency

```bash
npm install
```

## 4. Buat File `.env`

Salin isi dari `.env.example` lalu sesuaikan dengan konfigurasi yang digunakan.

Contoh:

```env
PORT=3000

COMPANY=PGI

DB_PATH=database/inventaris.db
```

## 5. Jalankan Aplikasi

```bash
npm start
```

atau

```bash
node server.js
```

---

# Struktur Project

```text
PGI-QC-INVENTARIS
│
├── controllers/
├── database/
├── middleware/
├── public/
├── routes/
├── services/
├── uploads/
├── utils/
├── views/
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js
```

---

# Alur Penggunaan

1. Login ke Dashboard.
2. Import file inventaris Excel.
3. Sistem membuat batch QC.
4. PIC melakukan QC melalui WhatsApp Bot.
5. Bot membaca barcode dan OCR.
6. Data inventaris diperbarui secara otomatis.
7. Dashboard menampilkan progres QC secara real-time.
8. Setelah seluruh data selesai diverifikasi, hasil QC dapat di-export ke Excel.

---

# Folder yang Tidak Di-upload ke GitHub

Folder dan file berikut berisi data sementara, data perusahaan, atau konfigurasi lokal sehingga tidak disertakan dalam repository.

```text
.env
node_modules/
uploads/
*.db
*.sqlite
*.sqlite3
.wwebjs_auth/
.wwebjs_cache/
logs/
```

---

# Package yang Digunakan

Beberapa package utama yang digunakan pada project ini:

* express
* better-sqlite3
* exceljs
* ejs
* multer
* whatsapp-web.js
* jimp
* @zxing/library
* dotenv
* qrcode-terminal

Semua dependency akan otomatis terpasang melalui:

```bash
npm install
```

---

# Catatan

Folder `uploads/` digunakan sebagai penyimpanan sementara untuk:

* File Excel hasil import.
* Foto barcode selama proses QC.

Folder tersebut tidak disertakan di repository GitHub karena berisi data operasional.

Database SQLite (`*.db`) juga tidak disertakan. Setelah project dijalankan pada lingkungan baru, database dapat dibuat kembali menggunakan script migrasi yang tersedia.

---

# Pengembang

Project ini dikembangkan sebagai aplikasi internal untuk membantu proses Quality Control inventaris perangkat IT menggunakan dashboard web dan WhatsApp Bot.

---

# Lisensi

Project ini dibuat untuk kebutuhan internal perusahaan dan pengembangan pribadi.
