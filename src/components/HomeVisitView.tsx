import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  MapPin,
  Calendar,
  User,
  Heart
} from 'lucide-react';
import { Siswa, HomeVisit, Settings } from '../types.ts';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase.ts';
import { format } from 'date-fns';
import { id as idID } from 'date-fns/locale';

interface HomeVisitViewProps {
  homeVisit: HomeVisit[];
  siswa: Siswa[];
  settings: Settings;
}

export default function HomeVisitView({ homeVisit, siswa, settings }: HomeVisitViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingHV, setEditingHV] = useState<HomeVisit | null>(null);

  // Form State
  const [siswaId, setSiswaId] = useState('');
  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [layanan, setLayanan] = useState('');
  const [guru, setGuru] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tindaklanjut, setTindaklanjut] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setSiswaId('');
    setTanggal(format(new Date(), 'yyyy-MM-dd'));
    setLayanan('');
    setGuru('');
    setKeterangan('');
    setTindaklanjut('');
    setEditingHV(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaId || !tanggal || !layanan || !guru || !keterangan) {
      alert('Semua field wajib diisi!');
      return;
    }

    setIsDeleting(true);
    try {
      if (editingHV) {
        const docRef = doc(db, 'homevisit', editingHV.id);
        await updateDoc(docRef, {
          siswaId,
          tanggal,
          layanan,
          guru,
          keterangan,
          tindaklanjut,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'homevisit'), {
          siswaId,
          tanggal,
          layanan,
          guru,
          keterangan,
          tindaklanjut,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'homevisit');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (hv: HomeVisit) => {
    setEditingHV(hv);
    setSiswaId(hv.siswaId);
    setTanggal(hv.tanggal);
    setLayanan(hv.layanan);
    setGuru(hv.guru);
    setKeterangan(hv.keterangan);
    setTindaklanjut(hv.tindaklanjut || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'homevisit', deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting homevisit:", error);
      alert("Gagal menghapus data: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDeleting(false);
    }
  };

  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');

  const classes = Array.from(new Set(siswa.map(s => s.kelas))).sort();

  const filteredHV = homeVisit.filter(hv => {
    const targetSiswa = siswa.find(s => s.id === hv.siswaId);
    if (!targetSiswa) return false;
    
    const matchesSearch = targetSiswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          hv.layanan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hv.guru.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKelas = selectedKelas === 'Semua' || targetSiswa.kelas === selectedKelas;

    return matchesSearch && matchesKelas;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Home Visit</h1>
          <p className="text-slate-500 text-sm mt-1">Kunjungan rumah untuk pemantauan perkembangan siswa.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Plus className="w-4 h-4" /> Tambah Kunjungan
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-xl text-slate-800">{editingHV ? 'Edit Home Visit' : 'Catat Home Visit Baru'}</h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Siswa</label>
              <select 
                value={siswaId} onChange={(e) => setSiswaId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              >
                <option value="">-- Pilih Siswa --</option>
                {siswa.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tanggal Kunjungan</label>
              <input 
                type="date"
                value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jenis Layanan</label>
              <select 
                value={layanan} onChange={(e) => setLayanan(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              >
                <option value="">-- Pilih Layanan --</option>
                <option>Pribadi</option>
                <option>Sosial</option>
                <option>Akademik</option>
                <option>Karir</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guru Pelaksana</label>
              <select 
                value={guru} onChange={(e) => setGuru(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              >
                <option value="">-- Pilih Guru --</option>
                <option>{settings.guru1_nama}</option>
                <option>{settings.guru2_nama}</option>
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Hasil Kunjungan / Evaluasi</label>
              <textarea 
                value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Detail kunjungan, kondisi rumah, dan pembicaraan dengan orang tua..." 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium min-h-32"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tindak Lanjut / Kesimpulan</label>
              <textarea 
                value={tindaklanjut} onChange={(e) => setTindaklanjut(e.target.value)}
                placeholder="Tindakan yang akan diambil setelah kunjungan..." 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium min-h-24"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 mt-2">
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
              >
                 {editingHV ? 'Simpan Perubahan' : 'Simpan Data Home Visit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Results */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
         <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama siswa atau guru..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-medium"
              />
            </div>
            <select 
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-bold text-slate-600 outline-none"
            >
              <option value="Semua">Semua Kelas</option>
              {classes.map(c => <option key={c} value={c}>Kelas {c}</option>)}
            </select>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredHV.length} Kunjungan Selesai</div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredHV.map((hv) => {
            const targetSiswa = siswa.find(s => s.id === hv.siswaId);
            if (!targetSiswa) return null;
            
            const visitDate = new Date(hv.tanggal);

            return (
              <div key={hv.id} className="bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-md transition-all group overflow-hidden flex flex-col">
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-2 rounded-lg">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{targetSiswa.nama}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{targetSiswa.kelas}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(visitDate, 'MMMM yyyy', { locale: idID })}</p>
                      <p className="font-bold text-slate-700 text-xs">{format(visitDate, 'dd-MM-yyyy', { locale: idID })}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {hv.layanan}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3" /> {hv.guru}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Heart className="w-3 h-3 text-emerald-400" /> Laporan:
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed">{hv.keterangan}</p>
                  </div>

                  {hv.tindaklanjut && (
                    <div className="pt-3 border-t border-slate-50 space-y-2">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Kesimpulan:</p>
                      <p className="text-emerald-700 text-sm font-medium italic leading-relaxed">{hv.tindaklanjut}</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-3 flex justify-end gap-2 border-t border-slate-100">
                  <button onClick={() => handleEdit(hv)} className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(hv.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all" title="Hapus">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredHV.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 italic">
              Tidak ada data home visit
            </div>
          )}
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
                Apakah Anda yakin ingin menghapus catatan home visit ini? Tindakan ini tidak dapat dibatalkan.
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
