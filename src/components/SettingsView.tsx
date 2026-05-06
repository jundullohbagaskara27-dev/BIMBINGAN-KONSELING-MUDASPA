import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Trash2, 
  Download, 
  Info,
  User,
  ShieldAlert,
  Server,
  Database,
  X,
  AlertTriangle
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
  allDataCount 
}: SettingsViewProps) {
  const [guru1, setGuru1] = useState(settings.guru1_nama);
  const [guru2, setGuru2] = useState(settings.guru2_nama);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        guru1_nama: guru1,
        guru2_nama: guru2
      });
      alert('Pengaturan berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/config');
    } finally {
      setIsSaving(false);
    }
  };

  const exportAllData = () => {
    const escape = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
    
    let csvContent = `BK SMA MUDASPA - EXPORT DATA\nTanggal: ${new Date().toLocaleString()}\n\n`;

    // SISWA
    csvContent += "=== DATA SISWA ===\nNama,NISN,Kelas,Jenis Kelamin,Terdaftar\n";
    siswa.forEach(s => {
      csvContent += `${escape(s.nama)},${escape(s.nisn)},${escape(s.kelas)},${escape(s.jk)},${escape(s.createdAt)}\n`;
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

  const clearAllData = async () => {
    if (confirmText !== 'HAPUS') return;
    
    setIsDeleting(true);
    try {
      const collections = ['siswa', 'konseling', 'homevisit', 'pelanggaran', 'keterlambatan'];
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        for (const docSnapshot of querySnapshot.docs) {
          await deleteDoc(doc(db, colName, docSnapshot.id));
        }
      }
      alert('Seluruh data berhasil dihapus.');
      setIsDeleteDialogOpen(false);
      setConfirmText('');
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Gagal menghapus data: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
          <p className="text-slate-500 text-sm mt-1">Konfigurasi identitas guru dan manajemen data pusat.</p>
        </div>
        <button 
          onClick={exportAllData}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Download className="w-5 h-5" /> Ekspor Semua Data (.csv)
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Identitas Guru */}
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-xl text-slate-800">Identitas Guru BK</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guru Pembimbing 1</label>
              <input 
                value={guru1} onChange={(e) => setGuru1(e.target.value)}
                placeholder="Nama Guru 1..." 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guru Pembimbing 2</label>
              <input 
                value={guru2} onChange={(e) => setGuru2(e.target.value)}
                placeholder="Nama Guru 2..." 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700"
              />
            </div>
            
            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
            >
               {isSaving ? 'Menyimpan...' : 'Perbarui Identitas'}
            </button>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-5 h-5 text-rose-600" />
            <h2 className="font-bold text-xl text-slate-800">Peliharaan Data</h2>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-100">
                <Database className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Record Data</p>
                 <p className="text-3xl font-black text-slate-800">{allDataCount}</p>
              </div>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">Seluruh data tersimpan secara real-time di cloud storage Firebase Enterprise yang aman.</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 py-4 rounded-xl font-bold border border-rose-100 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" /> Hapus Seluruh Data
            </button>
          </div>
        </div>
      </div>

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
                  <h3 className="font-black text-lg uppercase tracking-tight">Konfirmasi Penghapusan</h3>
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
                <div className="space-y-2">
                  <p className="text-slate-600 text-sm leading-relaxed">
                    ⚠️ <span className="font-bold text-rose-600 uppercase">Peringatan:</span> Anda akan menghapus <span className="font-bold">seluruh data</span> dari sistem secara permanen. Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <p className="text-slate-500 text-xs italic">
                    Seluruh data Siswa, Konseling, Home Visit, Pelanggaran, dan Keterlambatan akan hilang.
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
                    className="flex-1 px-4 py-4 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={clearAllData}
                    disabled={confirmText !== 'HAPUS' || isDeleting}
                    className="flex-1 px-4 py-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info System */}
      <div className="bg-indigo-900 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-indigo-800/30">
          <SettingsIcon className="w-32 h-32 rotate-12 transition-transform group-hover:rotate-45 duration-700" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-800 px-3 py-1 rounded-full text-indigo-300 text-[10px] font-bold uppercase tracking-widest">
              <Info className="w-3 h-3" /> System Information
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">BK SMA MUDASPA <span className="text-indigo-400 font-medium ml-2">v2.0.0</span></h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
               <div>
                <p className="text-indigo-400 text-[10px] uppercase font-black">Database Identity</p>
                <p className="text-white font-mono text-xs truncate max-w-[200px]">MUDASPA-PROD-ID</p>
              </div>
              <div>
                <p className="text-indigo-400 text-[10px] uppercase font-black">Cloud Region</p>
                <p className="text-white font-mono text-xs uppercase text-sm">Asia-Southeast1</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 text-center">
             <ShieldAlert className="w-8 h-8 text-indigo-300 mb-3" />
             <p className="text-white text-xs font-bold leading-tight">Data Terenkripsi &<br/>Terlindungi Cloud Run</p>
          </div>
        </div>
      </div>
    </div>
  );
}
