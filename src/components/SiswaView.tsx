import React, { useState } from 'react';
import { 
  Plus, 
  Upload, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  FileSpreadsheet,
  ClipboardList,
  Check,
  UserCheck
} from 'lucide-react';
import { Siswa, DAFTAR_KELAS_MUDASPA } from '../types.ts';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase.ts';

interface SiswaViewProps {
  siswa: Siswa[];
}

export default function SiswaView({ siswa }: SiswaViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterKelas, setSelectedFilterKelas] = useState('Semua');
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  
  // Single Form State (No NISN)
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [jk, setJk] = useState<'Laki-laki' | 'Perempuan' | ''>('');

  // Batch Form State
  const [batchKelas, setBatchKelas] = useState('X-1');
  const [batchDefaultJk, setBatchDefaultJk] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [batchRawText, setBatchRawText] = useState('');
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const resetForm = () => {
    setNama('');
    setKelas('');
    setJk('');
    setEditingSiswa(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !kelas || !jk) {
      alert('Nama, Kelas, dan Jenis Kelamin wajib diisi!');
      return;
    }

    setIsDeleting(true);
    try {
      if (editingSiswa) {
        const docRef = doc(db, 'siswa', editingSiswa.id);
        await updateDoc(docRef, {
          nama: nama.trim(),
          kelas,
          jk,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'siswa'), {
          nama: nama.trim(),
          kelas,
          jk,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siswa');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (s: Siswa) => {
    setEditingSiswa(s);
    setNama(s.nama);
    setKelas(s.kelas);
    setJk(s.jk);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'siswa', deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting siswa:", error);
      alert("Gagal menghapus data: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDeleting(false);
    }
  };

  // Parse batch raw text
  const parsedBatchNames = batchRawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.toLowerCase().startsWith('nama') && !line.toLowerCase().startsWith('no'));

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBatchNames.length === 0) {
      alert('Silakan masukkan atau tempel minimal satu nama siswa!');
      return;
    }

    setIsSubmittingBatch(true);
    let successCount = 0;
    try {
      for (const rawLine of parsedBatchNames) {
        // Support format: "Nama Lengkap" or "Nama Lengkap, Perempuan" or "1. Nama Lengkap"
        let cleanLine = rawLine.replace(/^\d+[\.\-\)]\s*/, '').trim(); // Remove leading numbering
        let itemNama = cleanLine;
        let itemJk = batchDefaultJk;

        if (cleanLine.includes(',') || cleanLine.includes('\t')) {
          const parts = cleanLine.split(/,|\t/).map(p => p.trim());
          itemNama = parts[0];
          if (parts[1]) {
            const secondPart = parts[1].toLowerCase();
            if (secondPart.startsWith('p') || secondPart.includes('perempuan') || secondPart.includes('wanita')) {
              itemJk = 'Perempuan';
            } else if (secondPart.startsWith('l') || secondPart.includes('laki') || secondPart.includes('pria')) {
              itemJk = 'Laki-laki';
            }
          }
        }

        if (itemNama.length > 0) {
          await addDoc(collection(db, 'siswa'), {
            nama: itemNama,
            kelas: batchKelas,
            jk: itemJk,
            createdAt: serverTimestamp()
          });
          successCount++;
        }
      }

      alert(`Berhasil menambahkan ${successCount} siswa ke kelas ${batchKelas}!`);
      setBatchRawText('');
      setShowBatchModal(false);
    } catch (error) {
      console.error("Error saving batch siswa:", error);
      alert("Gagal menyimpan beberapa data: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const filteredSiswa = siswa.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.kelas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKelas = selectedFilterKelas === 'Semua' || s.kelas === selectedFilterKelas;
    return matchesSearch && matchesKelas;
  });

  const availableClasses = Array.from(new Set([...DAFTAR_KELAS_MUDASPA, ...siswa.map(s => s.kelas)])).filter(Boolean).sort();

  const downloadTemplate = () => {
    let csv = "Nama,Kelas,Jenis Kelamin\n";
    csv += "ABIU PUTRA SAFARI,X-1,Laki-laki\n";
    csv += "ALIYA RAMADHANI F,X-1,Perempuan\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template-siswa-bk.csv");
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(',');
        if (currentline.length < 2) continue;

        let namaImport = '';
        let kelasImport = '';
        let jkImport: 'Laki-laki' | 'Perempuan' = 'Laki-laki';

        if (currentline.length >= 4) {
          // Legacy format: Nama, NISN, Kelas, JK
          namaImport = currentline[0]?.trim();
          kelasImport = currentline[2]?.trim();
          const rawJk = currentline[3]?.trim().toLowerCase();
          jkImport = (rawJk?.startsWith('p') || rawJk?.includes('perempuan')) ? 'Perempuan' : 'Laki-laki';
        } else {
          // Format baru: Nama, Kelas, JK
          namaImport = currentline[0]?.trim();
          kelasImport = currentline[1]?.trim();
          const rawJk = currentline[2]?.trim().toLowerCase();
          jkImport = (rawJk?.startsWith('p') || rawJk?.includes('perempuan')) ? 'Perempuan' : 'Laki-laki';
        }

        if (namaImport && kelasImport) {
          try {
            await addDoc(collection(db, 'siswa'), {
              nama: namaImport,
              kelas: kelasImport,
              jk: jkImport,
              createdAt: serverTimestamp()
            });
            importedCount++;
          } catch (error) {
            console.error("Error importing line:", i, error);
          }
        }
      }
      alert(`${importedCount} data siswa berhasil diimpor!`);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Siswa</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data seluruh siswa BK SMA MUDASPA.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>

          <button 
            onClick={() => setShowBatchModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
          >
            <ClipboardList className="w-4 h-4" /> Tempel / Input Banyak Siswa
          </button>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              id="csv-upload"
            />
            <label 
              htmlFor="csv-upload"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer border border-indigo-200"
            >
              <Upload className="w-4 h-4" /> Impor CSV
            </label>
          </div>

          <button 
            onClick={downloadTemplate}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4" /> Template CSV
          </button>
        </div>
      </div>

      {/* Form Tambah/Edit Siswa Tunggal */}
      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-xl text-slate-800">{editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
              <input 
                value={nama} onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama siswa..." 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Kelas</label>
              <select 
                value={kelas} onChange={(e) => setKelas(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {DAFTAR_KELAS_MUDASPA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jenis Kelamin</label>
              <select 
                value={jk} onChange={(e) => setJk(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                required
              >
                <option value="">-- Pilih --</option>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>
            
            <div className="md:col-span-3 mt-2 flex gap-3">
              <button 
                type="submit"
                disabled={isDeleting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                {editingSiswa ? 'Simpan Perubahan' : 'Simpan Data Siswa'}
              </button>
              <button 
                type="button"
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-xl font-bold transition-all"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Input Banyak Siswa (Tempel Daftar Nama) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmittingBatch && setShowBatchModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-800">
                <ClipboardList className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="font-black text-lg">Input / Tempel Daftar Siswa</h3>
                  <p className="text-xs text-emerald-600 font-medium">Salin dan tempel daftar nama siswa sekaligus per kelas</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBatchModal(false)}
                disabled={isSubmittingBatch}
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pilih Kelas Tujuan</label>
                  <select 
                    value={batchKelas} 
                    onChange={(e) => setBatchKelas(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {DAFTAR_KELAS_MUDASPA.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Default Jenis Kelamin</label>
                  <select 
                    value={batchDefaultJk} 
                    onChange={(e) => setBatchDefaultJk(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Daftar Nama Siswa (1 Nama per Baris)
                  </label>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {parsedBatchNames.length} nama terdeteksi
                  </span>
                </div>
                <textarea 
                  value={batchRawText}
                  onChange={(e) => setBatchRawText(e.target.value)}
                  placeholder={`Tempelkan daftar nama siswa di sini, contoh:\n1. Ahmad Fauzi\n2. Budi Santoso\n3. Citra Lestari\n(Atau format nama, jenis kelamin: Citra, Perempuan)`}
                  rows={8}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required
                />
                <p className="text-[11px] text-slate-400 italic">
                  💡 Tips: Nomor urut (1., 2.) di depan nama akan otomatis dibersihkan. Anda juga bisa menulis "Nama, Perempuan" jika jenis kelaminnya berbeda.
                </p>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  disabled={isSubmittingBatch}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingBatch || parsedBatchNames.length === 0}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingBatch ? 'Menyimpan...' : `Simpan ${parsedBatchNames.length} Siswa`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel Data Siswa (Tanpa Kolom NISN) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari siswa berdasarkan nama atau kelas..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
              />
            </div>
            <select
              value={selectedFilterKelas}
              onChange={(e) => setSelectedFilterKelas(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Semua">Semua Kelas ({siswa.length})</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>Kelas {c} ({siswa.filter(s => s.kelas === c).length})</option>
              ))}
            </select>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredSiswa.length} Siswa Ditampilkan</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left w-16">No</th>
                <th className="px-6 py-4 text-left">Nama Lengkap Siswa</th>
                <th className="px-6 py-4 text-left">Kelas</th>
                <th className="px-6 py-4 text-left">Jenis Kelamin</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSiswa.map((s, idx) => (
                <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{s.nama}</td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold text-[11px] uppercase border border-indigo-100">
                      {s.kelas}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.jk === 'Perempuan' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                      {s.jk}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleEdit(s)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget({id: s.id, name: s.nama})} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSiswa.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    Data siswa belum tersedia atau tidak cocok dengan pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Satu Siswa */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteTarget(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 bg-rose-50 border-b border-rose-100">
              <div className="flex items-center gap-3 text-rose-600">
                <Trash2 className="w-6 h-6" />
                <h3 className="font-black text-lg uppercase tracking-tight">Konfirmasi Hapus</h3>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600 leading-relaxed font-sans">
                Apakah Anda yakin ingin menghapus data siswa <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all font-sans"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 font-sans"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
