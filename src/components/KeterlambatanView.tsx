import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Calendar,
  Clock,
  UserCheck,
  AlertCircle,
  Edit2,
  UserPlus,
  X,
  FileText
} from 'lucide-react';
import { Siswa, Keterlambatan } from '../types.ts';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase.ts';
import { format } from 'date-fns';
import { id as idID } from 'date-fns/locale';

interface KeterlambatanViewProps {
  keterlambatan: Keterlambatan[];
  siswa: Siswa[];
}

export default function KeterlambatanView({ keterlambatan, siswa }: KeterlambatanViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form State Lateness
  const [siswaId, setSiswaId] = useState('');
  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Form State Quick Add Siswa
  const [isAddingSiswa, setIsAddingSiswa] = useState(false);
  const [newSiswaNama, setNewSiswaNama] = useState('');
  const [newSiswaKelas, setNewSiswaKelas] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaId || !tanggal) {
      alert('Siswa dan Tanggal wajib diisi!');
      return;
    }

    setIsDeleting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'keterlambatan', editingId), {
          siswaId,
          tanggal,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'keterlambatan'), {
          siswaId,
          tanggal,
          createdAt: serverTimestamp()
        });
      }
      setSiswaId('');
      setTanggal(format(new Date(), 'yyyy-MM-dd'));
      setShowForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'keterlambatan');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiswaNama || !newSiswaKelas) {
      alert('Nama dan Kelas wajib diisi!');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'siswa'), {
        nama: newSiswaNama,
        nisn: '',
        kelas: newSiswaKelas,
        jk: 'Laki-laki',
        createdAt: new Date().toISOString()
      });
      setSiswaId(docRef.id);
      setIsAddingSiswa(false);
      setNewSiswaNama('');
      setNewSiswaKelas('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'siswa');
    }
  };

  const handleEdit = (k: Keterlambatan) => {
    setEditingId(k.id);
    setSiswaId(k.siswaId);
    setTanggal(k.tanggal);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'keterlambatan', deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting keterlambatan:", error);
      alert("Gagal menghapus data: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDeleting(false);
    }
  };

  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');

  const classes = Array.from(new Set(siswa.map(s => s.kelas))).sort();

  const filteredKeterlambatan = keterlambatan.filter(k => {
    const targetSiswa = siswa.find(s => s.id === k.siswaId);
    if (!targetSiswa) return false;
    
    const matchesSearch = targetSiswa.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKelas = selectedKelas === 'Semua' || targetSiswa.kelas === selectedKelas;

    return matchesSearch && matchesKelas;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-orange-600">Presensi Terlambat</h1>
          <p className="text-slate-500 text-sm mt-1">Pencatatan harian siswa yang datang terlambat.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setEditingId(null); setSiswaId(''); setShowForm(!showForm); }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-orange-100"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Batal' : 'Catat Terlambat'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-orange-100 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-600" />
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-xl text-slate-800">{editingId ? 'Edit Catatan Terlambat' : 'Catat Keterlambatan Baru'}</h2>
            <button 
              onClick={() => setIsAddingSiswa(!isAddingSiswa)} 
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" /> {isAddingSiswa ? 'Kembali Pilih Siswa' : 'Tambah Siswa Cepat'}
            </button>
          </div>

          {isAddingSiswa ? (
            <form onSubmit={handleQuickAddSiswa} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                placeholder="Nama Lengkap Siswa..."
                value={newSiswaNama} onChange={e => setNewSiswaNama(e.target.value)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <input 
                placeholder="Kelas..."
                value={newSiswaKelas} onChange={e => setNewSiswaKelas(e.target.value)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <button type="submit" className="bg-indigo-600 text-white font-bold rounded-xl py-3 shadow-lg shadow-indigo-100">Simpan & Pilih</button>
            </form>
          ) : (
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pilih Siswa</label>
                <select 
                  value={siswaId} onChange={(e) => setSiswaId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  <option value="">-- Pilih --</option>
                  {siswa.sort((a,b) => a.nama.localeCompare(b.nama)).map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                <input 
                  type="date"
                  value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full bg-orange-600 text-white font-bold h-[46px] rounded-xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2">
                  {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? 'Simpan Perubahan' : 'Masukkan Data'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
              />
            </div>
            <select 
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm font-bold text-slate-600 outline-none"
            >
              <option value="Semua">Semua Kelas</option>
              {classes.map(c => <option key={c} value={c}>Kelas {c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
              <p className="text-lg font-black text-orange-600 leading-tight">{keterlambatan.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-center px-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Siswa</p>
              <p className="text-lg font-black text-orange-600 leading-tight">{new Set(keterlambatan.map(k => k.siswaId)).size}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4 text-left">Nama Siswa</th>
                <th className="px-6 py-4 text-left">Kelas</th>
                <th className="px-6 py-4 text-left">Tanggal Insiden</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKeterlambatan.sort((a, b) => b.tanggal.localeCompare(a.tanggal)).map((k) => {
                const targetSiswa = siswa.find(s => s.id === k.siswaId);
                if (!targetSiswa) return null;
                return (
                  <tr key={k.id} className="hover:bg-orange-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{targetSiswa.nama}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider">{targetSiswa.kelas}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        {format(new Date(k.tanggal), 'dd MMMM yyyy', { locale: idID })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(k)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(k.id)} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-white rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredKeterlambatan.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">
                    Belum ada data keterlambatan ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteId(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-6 bg-rose-50 border-b border-rose-100">
              <div className="flex items-center gap-3 text-rose-600">
                <Trash2 className="w-6 h-6" />
                <h3 className="font-black text-lg uppercase tracking-tight">Konfirmasi Hapus</h3>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600 leading-relaxed font-sans">
                Apakah Anda yakin ingin menghapus data keterlambatan ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
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
