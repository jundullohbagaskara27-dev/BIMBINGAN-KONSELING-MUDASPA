# PANDUAN PENGGUNAAN PROYEK BK DI VS CODE (SMA MUHAMMADIYAH SINGAPARNA)

Proyek ini telah dikonfigurasi dan siap dijalankan secara lokal di Visual Studio Code (VS Code).

---

## 📁 Struktur File & Folder di VS Code

```text
├── public/                     # Asset statis & file unduhan
├── src/
│   ├── components/             # Komponen antarmuka (UI)
│   │   ├── HomeVisitView.tsx   # Fitur Home Visit + Upload Foto Kompresi + Modal & Cetak
│   │   ├── SiswaView.tsx       # Data Siswa (X-1 s/d XII-3) tanpa kolom NISN
│   │   ├── KonselingView.tsx   # Catatan Konseling Individu / Kelompok
│   │   ├── PelanggaranView.tsx # Catatan Pelanggaran Siswa
│   │   ├── KeterlambatanView.tsx # Rekap Keterlambatan Siswa
│   │   ├── Dashboard.tsx       # Statistik & Ringkasan Aktivitas BK
│   │   ├── AnalisisView.tsx    # Grafik & Analisis Data
│   │   ├── TindakLanjutView.tsx # Rekomendasi & Tindak Lanjut
│   │   ├── SettingsView.tsx    # Pengaturan Guru BK & Reset Catatan Aman
│   │   ├── Sidebar.tsx         # Navigasi & Tautan Google Drive
│   │   ├── BkLogo.tsx          # Logo Profesional Bimbingan dan Konseling
│   │   └── Login.tsx           # Layar Masuk Petugas BK
│   ├── lib/
│   │   ├── firebase.ts         # Koneksi Firebase Firestore
│   │   └── utils.ts            # Helper utility kelas Tailwind
│   ├── utils/
│   │   └── imageCompressor.ts  # Kompresi foto otomatis sebelum upload
│   ├── types.ts                # TypeScript interfaces (Siswa, HomeVisit dg foto, dll)
│   ├── App.tsx                 # Root component aplikasi
│   ├── main.tsx                # Entry point React
│   └── index.css               # Styling Tailwind CSS
├── index.html                  # HTML entry point
├── package.json                # Dependensi proyek (React, Vite, Lucide, Tailwind, Firebase)
├── tsconfig.json               # Konfigurasi TypeScript
├── vite.config.ts              # Konfigurasi Vite
└── firestore.rules             # Aturan keamanan database Firestore
```

---

## 🚀 Langkah Menjalankan di Visual Studio Code

### Langkah 1: Buka Folder di VS Code
1. Ekstrak file zip yang telah Anda unduh.
2. Buka aplikasi **Visual Studio Code**.
3. Klik menu **File** > **Open Folder...** (atau tekan `Ctrl + K, Ctrl + O`).
4. Pilih folder hasil ekstrak proyek ini.

### Langkah 2: Buka Terminal di VS Code
- Klik menu **Terminal** > **New Terminal** (atau tekan shortcut `Ctrl + ~` / `Ctrl + \``).

### Langkah 3: Install Dependensi (Hanya Sekali)
Di dalam terminal VS Code, jalankan perintah:
```bash
npm install
```
*(Tunggu hingga seluruh paket selesai dipasang di folder `node_modules`)*

### Langkah 4: Jalankan Server Development
Setelah install selesai, jalankan perintah:
```bash
npm run dev
```
Terminal akan menampilkan alamat lokal, biasanya:
`http://localhost:3000` atau `http://localhost:5173`

Buka alamat tersebut di Google Chrome atau browser pilihan Anda.

---

## 📸 Fitur Khusus: Dokumentasi Foto Home Visit
- Terletak pada: `src/components/HomeVisitView.tsx`
- Menggunakan modul: `src/utils/imageCompressor.ts`
- Mendukung:
  1. Upload multiple foto (JPG, PNG, WebP)
  2. Kompresi otomatis (max 1280px, kualitas 75%) sehingga hemat penyimpanan database dan cepat diakses
  3. Preview thumbnail interaktif di kartu riwayat kunjungan
  4. Lightbox layar penuh dengan navigasi slide (sebelumnya/selanjutnya) dan tombol Unduh Foto
  5. Lembar cetak resmi format A4 lengkap dengan Kop Surat SMA Muhammadiyah Singaparna, tabel data siswa, uraian masalah, tindak lanjut, dan lampiran dokumentasi foto.

---

## 👤 Guru Pembimbing
- **Jundi Jundulloh, S.Pd** (Guru Bimbingan dan Konseling SMA Muhammadiyah Singaparna)
