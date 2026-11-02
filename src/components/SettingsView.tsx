import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Trash2, 
  Download, 
  User, 
  Server, 
  Database, 
  X, 
  AlertTriangle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Settings, Siswa, Konseling, HomeVisit, Pelanggaran, Keterlambatan } from '../types.ts';
import { 
  doc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase.ts';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsViewProps {
  settings: Settings;
  siswa: Siswa[];
  konseling: Konseling[];
  homeVisit: HomeVisit[];
  pelanggaran: Pelanggaran[];
  keterlambatan: Keterlambatan[];
  allDataCount: number;
}

export default function SettingsView({ 
  settings, 
  siswa, 
  konseling, 
  homeVisit, 
  pelanggaran, 
  keterlambatan, 
}: SettingsViewProps) {
  // Hanya 1 guru: Jundi Jundulloh, S.Pd
  const [guruNama, setGuruNama] = useState(settings.guru_nama || settings.guru1_nama || 'Jundi Jundulloh, S.Pd');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const totalCatatan = konseling.length + homeVisit.length + pelanggaran.length + keterlambatan.length;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        guru_nama: guruNama.trim()
      }, { merge: true });
      alert('Pengaturan identitas guru berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/config');
    } finally {
      setIsSaving(false);
    }
  };

  const exportAllData = () => {
    const escape = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
    
    let csvContent = `BK SMA MUDASPA - EXPORT DATA\nTanggal: ${new Date().toLocaleString()}\nGuru BK: ${guruNama}\n\n`;

    // SISWA (NISN dihapus sesuai instruksi)
    csvContent += "=== DATA SISWA ===\nNama,Kelas,Jenis Kelamin,Terdaftar\n";
    siswa.forEach(s => {
      csvContent += `${escape(s.nama)},${escape(s.kelas)},${escape(s.jk)},${escape(s.createdAt || '')}\n`;
    });
    csvContent += "\n";

    // KONSELING
    csvContent += "=== DATA KONSELING ===\nSiswa,Tanggal,Layanan,Guru,Keterangan,Tindak Lanjut\n";
    konseling.forEach(k => {
      const s = siswa.find(item => item.id === k.siswaId)?.nama || k.siswaId;
      csvContent += `${escape(s)},${escape(k.tanggal)},${escape(k.layanan)},${escape(k.guru)},${escape(k.keterangan)},${escape(k.tindaklanjut)}\n`;
    });
    csvContent += "\n";

    // HOME VISIT
    csvContent += "=== DATA HOME VISIT ===\nSiswa,Tanggal,Layanan,Guru,Keterangan,Tindak Lanjut\n";
    homeVisit.forEach(h => {
      const s = siswa.find(item => item.id === h.siswaId)?.nama || h.siswaId;
      csvContent += `${escape(s)},${escape(h.tanggal)},${escape(h.layanan)},${escape(h.guru)},${escape(h.keterangan)},${escape(h.tindaklanjut)}\n`;
    });
    csvContent += "\n";

    // PELANGGARAN
    csvContent += "=== DATA PELANGGARAN ===\nSiswa,Tanggal,Jenis,Keterangan\n";
    pelanggaran.forEach(p => {
      const s = siswa.find(item => item.id === p.siswaId)?.nama || p.siswaId;
      csvContent += `${escape(s)},${escape(p.tanggal)},${escape(p.jenis)},${escape(p.keterangan)}\n`;
    });
    csvContent += "\n";

    // KETERLAMBATAN
    csvContent += "=== DATA KETERLAMBATAN ===\nSiswa,Tanggal\n";
    keterlambatan.forEach(k => {
      const s = siswa.find(item => item.id === k.siswaId)?.nama || k.siswaId;
      csvContent += `${escape(s)},${escape(k.tanggal)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BK_MUDASPA_FullData_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // Menu Hapus Semua: JANGAN HAPUS DATA SISWA!
  const clearActivityRecords = async () => {
    if (confirmText !== 'HAPUS') return;
    
    setIsDeleting(true);
    try {
      // PERHATIKAN: 'siswa' sengaja DIKECUALIKAN agar data master siswa tetap utuh & aman!
      const collections = ['konseling', 'homevisit', 'pelanggaran', 'keterlambatan'];
      let totalDeleted = 0;
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        for (const docSnapshot of querySnapshot.docs) {
          await deleteDoc(doc(db, colName, docSnapshot.id));
          totalDeleted++;
        }
      }
      alert(`Berhasil mereset seluruh catatan aktivitas (${totalDeleted} data). Data master siswa (${siswa.length} siswa) tetap aman.`);
      setIsDeleteDialogOpen(false);
      setConfirmText('');
    } catch (error) {
      console.error("Error clearing activity records:", error);
      alert("Gagal mereset catatan: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-slate-500 text-sm mt-1">Konfigurasi identitas Guru BK dan pemeliharaan data.</p>
        </div>
        <button 
          onClick={exportAllData}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Download className="w-5 h-5" /> Ekspor Semua Data (.csv)
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Identitas Guru BK (Hanya Satu Guru) */}
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-xl text-slate-800">Identitas Guru BK</h2>
              <p className="text-xs text-slate-400">Guru Bimbingan Konseling utama sekolah</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Nama Guru BK / Konselor
              </label>
              <input 
                value={guruNama} 
                onChange={(e) => setGuruNama(e.target.value)}
                placeholder="Jundi Jundulloh, S.Pd" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-800"
              />
              <p className="text-xs text-slate-400 mt-1 ml-1">
                Nama ini otomatis digunakan pada seluruh formulir konseling, home visit, dan laporan resmi.
              </p>
            </div>
            
            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? 'Menyimpan...' : 'Perbarui Identitas Guru'}
            </button>
          </div>
        </div>

        {/* Pemeliharaan Catatan & Proteksi Siswa */}
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-slate-800">Pemeliharaan Catatan</h2>
                <p className="text-xs text-slate-400">Reset histori aktivitas bimbingan</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-800 leading-tight">
                  <span className="font-bold">Proteksi Data Siswa:</span> Data {siswa.length} siswa akan tetap aman dan tidak akan dihapus saat melakukan reset.
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catatan Konseling, HV & Pelanggaran</p>
                  <p className="text-2xl font-black text-slate-800">{totalCatatan}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Data Siswa Terdaftar</p>
                  <p className="text-2xl font-black text-emerald-700">{siswa.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button 
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={totalCatatan === 0}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 py-3.5 rounded-xl font-bold border border-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" /> Hapus Seluruh Catatan (Tanpa Hapus Siswa)
            </button>
          </div>
        </div>
      </div>

      {/* Unduh Berkas untuk Visual Studio Code (VS Code) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Export VS Code Ready
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                  Berkas Proyek untuk Visual Studio Code
                </h2>
                <p className="text-sm text-indigo-200/80">
                  Unduh seluruh kode sumber atau modul spesifik untuk langsung dibuka dan dijalankan di VS Code komputer Anda.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            {/* Opsi 1: Proyek Lengkap */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-indigo-400/50 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    📦 Proyek Penuh (Full Project)
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                    Direkomendasikan
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Semua file aplikasi lengkap: data 179 siswa (X-1 s/d XII-3), logo BK, formulir konseling, home visit + foto, rekap keterlambatan, dan konfigurasi Vite + Tailwind.
                </p>
              </div>
              <div className="mt-5">
                <a
                  href="/bk-mudaspa-vscode-project.zip"
                  download="bk-mudaspa-vscode-project.zip"
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
                >
                  <Download className="w-4 h-4" /> Unduh Proyek Lengkap (.ZIP)
                </a>
              </div>
            </div>

            {/* Opsi 2: Modul Home Visit Foto Saja */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-indigo-400/50 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    📸 Update Home Visit + Foto
                  </h3>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-md border border-cyan-500/30">
                    3 File Utama
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hanya file fitur dokumentasi foto kunjungan rumah: <code className="text-indigo-300 font-mono text-[11px]">HomeVisitView.tsx</code>, <code className="text-indigo-300 font-mono text-[11px]">imageCompressor.ts</code>, dan <code className="text-indigo-300 font-mono text-[11px]">types.ts</code>.
                </p>
              </div>
              <div className="mt-5">
                <a
                  href="/homevisit-photo-update.zip"
                  download="homevisit-photo-update.zip"
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-400/30 font-bold py-3 px-4 rounded-xl transition-all text-sm"
                >
                  <Download className="w-4 h-4" /> Unduh Update Home Visit (.ZIP)
                </a>
              </div>
            </div>
          </div>

          {/* Quick Terminal Guide */}
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-5 text-xs space-y-3 font-mono">
            <div className="flex items-center justify-between text-indigo-300 font-sans font-bold">
              <span>⚡ Cara Menjalankan di VS Code Komputer Anda:</span>
              <span className="text-[11px] font-normal text-slate-400">Terminal Bash / CMD / PowerShell</span>
            </div>
            <ol className="space-y-2 font-mono text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">1.</span>
                <span>Ekstrak file <span className="text-emerald-400">bk-mudaspa-vscode-project.zip</span> ke folder komputer Anda</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">2.</span>
                <span>Buka VS Code &gt; klik menu <b>File &gt; Open Folder...</b> lalu pilih folder hasil ekstrak</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">3.</span>
                <span>Buka Terminal di VS Code (tekan <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">Ctrl + ~</kbd>) lalu pasang paket:</span>
              </li>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-emerald-400 select-all font-bold">
                npm install
              </div>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">4.</span>
                <span>Jalankan server aplikasi:</span>
              </li>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-emerald-400 select-all font-bold">
                npm run dev
              </div>
            </ol>
          </div>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Reset */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsDeleteDialogOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
                <div className="flex items-center gap-3 text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-black text-lg uppercase tracking-tight">Konfirmasi Reset Catatan</h3>
                </div>
                <button 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                  className="p-2 hover:bg-rose-100 rounded-full transition-colors text-rose-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Data {siswa.length} Siswa TIDAK AKAN DIHAPUS. Hanya riwayat catatan yang dibersihkan.</span>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    Tindakan ini akan menghapus permanen sebanyak <span className="font-bold text-rose-600">{totalCatatan} catatan</span> (Konseling, Home Visit, Pelanggaran, dan Keterlambatan).
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                    Ketik "HAPUS" untuk konfirmasi
                  </label>
                  <input 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Ketik HAPUS di sini..."
                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all font-black text-center text-rose-600 tracking-widest"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsDeleteDialogOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={clearActivityRecords}
                    disabled={confirmText !== 'HAPUS' || isDeleting}
                    className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? 'Mereset...' : 'Ya, Hapus Catatan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
