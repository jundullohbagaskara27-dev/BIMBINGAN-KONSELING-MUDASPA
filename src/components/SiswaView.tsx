import React, { useState } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Siswa } from '../types.ts';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase.ts';
import { cn } from '../lib/utils.ts';

interface SiswaViewProps {
  siswa: Siswa[];
}

export default function SiswaView({ siswa }: SiswaViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);
  
  // Form State
  const [nama, setNama] = useState('');
  const [nisn, setNisn] = useState('');
  const [kelas, setKelas] = useState('');
  const [jk, setJk] = useState<'Laki-laki' | 'Perempuan' | ''>('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const resetForm = () => {
    setNama('');
    setNisn('');
    setKelas('');
    setJk('');
    setEditingSiswa(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nisn || !kelas || !jk) {
      alert('Semua field wajib diisi!');
      return;
    }

    setIsDeleting(true);
    try {
      if (editingSiswa) {
        const docRef = doc(db, 'siswa', editingSiswa.id);
        await updateDoc(docRef, {
          nama,
          nisn,
          kelas,
          jk,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'siswa'), {
          nama,
          nisn,
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
    setNisn(s.nisn);
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

  const filteredSiswa = siswa.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nisn.includes(searchTerm) ||
    s.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadTemplate = () => {
    let csv = "Nama,NISN,Kelas,Jenis Kelamin\n";
    csv += "Contoh Nama,123456789,X 1,Laki-laki\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template-siswa.csv");
    link.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      let importedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(',');
        if (currentline.length < 4) continue;

        const [namaImport, nisnImport, kelasImport, jkImport] = currentline.map(s => s.trim());
        if (namaImport && nisnImport && kelasImport) {
          try {
            await addDoc(collection(db, 'siswa'), {
              nama: namaImport,
              nisn: nisnImport,
              kelas: kelasImport,
              jk: jkImport || 'Laki-laki',
              createdAt: serverTimestamp()
            });
            importedCount++;
          } catch (error) {
            console.error("Error importing line:", i, error);
          }
        }
      }
      alert(`${importedCount} data siswa berhasil diimpor!`);
      e.target.value = ''; // Reset input
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Siswa</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data seluruh siswa secara terorganisir.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus className="w-4 h-4" /> Tambah Siswa
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
              <Upload className="w-4 h-4" /> Impor Excel/CSV
            </label>
          </div>

          <button 
            onClick={downloadTemplate}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-slate-200"
          >
            <FileSpreadsheet className="w-4 h-4" /> Template
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-xl text-slate-800">{editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nama Lengkap</label>
              <input 
                value={nama} onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama..." 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">NISN / NIS</label>
              <input 
                value={nisn} onChange={(e) => setNisn(e.target.value)}
                placeholder="Masukkan nomor identitas..." 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Kelas</label>
              <select 
                value={kelas} onChange={(e) => setKelas(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              >
                <option value="">-- Pilih Kelas --</option>
                <option>X 1</option>
                <option>X 2</option>
                <option>XI F1</option>
                <option>XI F2</option>
                <option>XI F3</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jenis Kelamin</label>
              <select 
                value={jk} onChange={(e) => setJk(e.target.value as any)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              >
                <option value="">-- Pilih --</option>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-4 mt-2">
              <button 
                type="submit"
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                {editingSiswa ? 'Simpan Perubahan' : 'Simpan Data Siswa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa berdasarkan nama, NISN, atau kelas..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredSiswa.length} Total Data</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">Nama Lengkap</th>
                <th className="px-6 py-4 text-left">NISN</th>
                <th className="px-6 py-4 text-left">Kelas</th>
                <th className="px-6 py-4 text-left">JK</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSiswa.map((s) => (
                <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700">{s.nama}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono tracking-tight">{s.nisn}</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg font-bold text-[10px] uppercase">{s.kelas}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{s.jk}</td>
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
                    Data tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
                Seluruh catatan terkait (Konseling, Pelanggaran, dll) mungkin akan kehilangan referensi nama.
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
