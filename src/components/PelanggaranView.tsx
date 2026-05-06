import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  AlertTriangle,
  Calendar,
  User,
  Info
} from 'lucide-react';
import { Siswa, Pelanggaran } from '../types.ts';
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

interface PelanggaranViewProps {
  pelanggaran: Pelanggaran[];
  siswa: Siswa[];
}

export default function PelanggaranView({ pelanggaran, siswa }: PelanggaranViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPelanggaran, setEditingPelanggaran] = useState<Pelanggaran | null>(null);

  // Form State
  const [siswaId, setSiswaId] = useState('');
  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [jenis, setJenis] = useState('');
  const [keterangan, setKeterangan] = useState('');

  const jenisPelanggaran = [
    { kategori: "Kedisiplinan", item: "Kedatangan terlambat" },
    { kategori: "Kedisiplinan", item: "Keluar tanpa izin (Bolos)" },
    { kategori: "Kedisiplinan", item: "Tidak masuk tanpa keterangan" },
    { kategori: "Kerapian", item: "Berseragam tidak lengkap" },
    { kategori: "Kerapian", item: "Rambut tidak sesuai aturan" },
    { kategori: "Kerapian", item: "Kuku panjang/berwarna" },
    { kategori: "Kerapian", item: "Memakai aksesoris berlebihan" },
    { kategori: "Etika", item: "Tidak hormat kepada guru" },
    { kategori: "Etika", item: "Berkata kasar/tidak sopan" },
    { kategori: "Etika", item: "Membantah instruksi guru" },
    { kategori: "Akademik", item: "Tidak mengumpulkan tugas" },
    { kategori: "Akademik", item: "Menyontek saat ujian" },
    { kategori: "Akademik", item: "Tidur di kelas" },
    { kategori: "Ketertiban", item: "Bermain HP saat pelajaran" },
    { kategori: "Ketertiban", item: "Makan di dalam kelas" },
    { kategori: "Ketertiban", item: "Kegaduhan di dalam kelas" },
    { kategori: "Berat", item: "Perkelahian/Pengeroyokan" },
    { kategori: "Berat", item: "Merusak fasilitas sekolah" },
    { kategori: "Berat", item: "Membawa barang terlarang (Rokok/Mirasantika)" },
    { kategori: "Berat", item: "Tindakan amoral" },
    { kategori: "Lainnya", item: "Lainnya" }
  ];

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  const resetForm = () => {
    setSiswaId('');
    setTanggal(format(new Date(), 'yyyy-MM-dd'));
    setJenis('');
    setKeterangan('');
    setEditingPelanggaran(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siswaId || !tanggal || !jenis) {
      alert('Siswa, Tanggal, dan Jenis Pelanggaran wajib diisi!');
      return;
    }

    setIsDeleting(true);
    try {
      if (editingPelanggaran) {
        const docRef = doc(db, 'pelanggaran', editingPelanggaran.id);
        await updateDoc(docRef, {
          siswaId,
          tanggal,
          jenis,
          keterangan,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'pelanggaran'), {
          siswaId,
          tanggal,
          jenis,
          keterangan,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'pelanggaran');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (p: Pelanggaran) => {
    setEditingPelanggaran(p);
    setSiswaId(p.siswaId);
    setTanggal(p.tanggal);
    setJenis(p.jenis);
    setKeterangan(p.keterangan || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'pelanggaran', deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting pelanggaran:", error);
      alert("Gagal menghapus data: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsDeleting(false);
    }
  };

  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');

  const classes = Array.from(new Set(siswa.map(s => s.kelas))).sort();

  const filteredPelanggaran = pelanggaran.filter(p => {
    const targetSiswa = siswa.find(s => s.id === p.siswaId);
    if (!targetSiswa) return false;
    
    const matchesSearch = targetSiswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.jenis.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKelas = selectedKelas === 'Semua' || targetSiswa.kelas === selectedKelas;

    return matchesSearch && matchesKelas;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-rose-600">Pelanggaran Siswa</h1>
          <p className="text-slate-500 text-sm mt-1">Pencatatan insiden pelanggaran tata tertib sekolah.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-rose-100"
        >
          <Plus className="w-4 h-4" /> Catat Pelanggaran
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-600" />
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-xl text-slate-800">{editingPelanggaran ? 'Edit Pelanggaran' : 'Catat Pelanggaran Baru'}</h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Siswa</label>
              <select 
                value={siswaId} onChange={(e) => setSiswaId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              >
                <option value="">-- Pilih Siswa --</option>
                {siswa.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tanggal</label>
              <input 
                type="date"
                value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Jenis Pelanggaran</label>
              <select 
                value={jenis} onChange={(e) => setJenis(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
              >
                <option value="">-- Pilih Jenis Pelanggaran --</option>
                {Array.from(new Set(jenisPelanggaran.map(j => j.kategori))).map(kat => (
                  <optgroup key={kat} label={kat}>
                    {jenisPelanggaran.filter(j => j.kategori === kat).map(v => (
                      <option key={v.item} value={v.item}>{v.item}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Detail & Tindakan (Opsional)</label>
              <textarea 
                value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Detail insiden dan tindakan yang telah diberikan..." 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium min-h-24"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 mt-2">
              <button 
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-rose-100 transition-all active:scale-95"
              >
                  {editingPelanggaran ? 'Simpan Perubahan' : 'Simpan Pelanggaran'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Results */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
         <div className="p-4 bg-rose-50 border-b border-rose-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-300" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari berdasarkan nama siswa atau pelanggaran..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-rose-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm font-medium"
              />
            </div>
            <select 
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="px-4 py-2.5 bg-white border border-rose-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm font-bold text-slate-600 outline-none"
            >
              <option value="Semua">Semua Kelas</option>
              {classes.map(c => <option key={c} value={c}>Kelas {c}</option>)}
            </select>
          </div>
          <div className="text-xs font-bold text-rose-400 uppercase tracking-widest">{filteredPelanggaran.length} Pelanggaran Tercatat</div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPelanggaran.map((p) => {
            const targetSiswa = siswa.find(s => s.id === p.siswaId);
            if (!targetSiswa) return null;
            
            const incidentDate = new Date(p.tanggal);

            return (
              <div key={p.id} className="bg-white border border-slate-100 rounded-2xl shadow-md p-5 flex flex-col relative group transition-all hover:scale-[1.01]">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-rose-50 p-2.5 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(p)} className="p-1.5 text-indigo-400 hover:bg-slate-100 rounded-md"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteTarget({id: p.id, name: targetSiswa.nama})} className="p-1.5 text-rose-400 hover:bg-slate-100 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-black text-slate-800 tracking-tight leading-tight">{targetSiswa.nama}</h3>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">{targetSiswa.kelas} • NISN/NIS {targetSiswa.nisn}</p>
                  </div>

                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <p className="text-rose-700 text-xs font-black uppercase tracking-wider mb-1">Jenis Pelanggaran:</p>
                    <p className="text-rose-900 font-bold text-sm">{p.jenis}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                       <Calendar className="w-3 h-3" /> {format(incidentDate, 'dd-MM-yyyy', { locale: idID })}
                    </div>
                    {p.keterangan && (
                      <div className="pt-2">
                        <p className="text-slate-500 text-xs italic leading-relaxed border-l-2 border-slate-100 pl-3">"{p.keterangan}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredPelanggaran.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 italic">
              Tidak ada data pelanggaran
            </div>
          )}
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
                Apakah Anda yakin ingin menghapus catatan pelanggaran untuk <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>? Tindakan ini tidak dapat dibatalkan.
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
