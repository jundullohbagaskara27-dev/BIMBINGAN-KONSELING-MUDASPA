import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X,
  MapPin,
  Calendar,
  User,
  Heart,
  Camera,
  Image as ImageIcon,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  Printer,
  FileText,
  AlertCircle
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
import { compressImage, getBase64SizeKb } from '../utils/imageCompressor.ts';
import BkLogo from './BkLogo.tsx';

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
  const activeGuru = settings.guru_nama || settings.guru1_nama || 'Jundi Jundulloh, S.Pd';
  const [siswaId, setSiswaId] = useState('');
  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [layanan, setLayanan] = useState('');
  const [guru, setGuru] = useState(activeGuru);
  const [keterangan, setKeterangan] = useState('');
  const [tindaklanjut, setTindaklanjut] = useState('');
  const [fotoList, setFotoList] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Lightbox Modal State
  const [lightboxData, setLightboxData] = useState<{
    photos: string[];
    index: number;
    title: string;
    date: string;
  } | null>(null);

  // Print Report Modal State
  const [printHV, setPrintHV] = useState<HomeVisit | null>(null);

  const resetForm = () => {
    setSiswaId('');
    setTanggal(format(new Date(), 'yyyy-MM-dd'));
    setLayanan('');
    setGuru(activeGuru);
    setKeterangan('');
    setTindaklanjut('');
    setFotoList([]);
    setEditingHV(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (fotoList.length + files.length > 5) {
      alert('Maksimal 5 foto dokumentasi per kunjungan untuk menjaga efisiensi penyimpanan.');
      return;
    }

    setIsCompressing(true);
    try {
      const newCompressedPhotos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          continue;
        }
        const compressed = await compressImage(file, 1024, 1024, 0.72);
        newCompressedPhotos.push(compressed);
      }
      setFotoList(prev => [...prev, ...newCompressedPhotos]);
    } catch (err) {
      console.error('Error compressing image:', err);
      alert('Terjadi kesalahan saat memproses gambar.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFoto = (index: number) => {
    setFotoList(prev => prev.filter((_, i) => i !== index));
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
          foto: fotoList,
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
          foto: fotoList,
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
    setFotoList(hv.foto || []);
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Home Visit
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Dokumentasi Foto
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kunjungan rumah untuk pemantauan perkembangan siswa disertai arsip bukti dokumentasi foto.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/homevisit-photo-update.zip"
            download="homevisit-photo-update.zip"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border border-slate-200 shadow-xs"
            title="Unduh file kode sumber fitur Home Visit untuk dimasukkan ke VS Code"
          >
            <Download className="w-4 h-4 text-emerald-600" /> 
            <span>File VS Code (.ZIP)</span>
          </a>
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
          >
            <Plus className="w-4 h-4" /> Tambah Kunjungan
          </button>
        </div>
      </div>

      {/* Form Modal / Container */}
      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-bold text-xl text-slate-800">
                {editingHV ? 'Edit Catatan Home Visit' : 'Catat Home Visit Baru'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Lengkapi informasi kunjungan dan unggah foto dokumentasi rumah / pertemuan orang tua.</p>
            </div>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Pilih Siswa *</label>
              <select 
                value={siswaId} onChange={(e) => setSiswaId(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-800"
              >
                <option value="">-- Pilih Siswa --</option>
                {siswa.map(s => <option key={s.id} value={s.id}>{s.nama} ({s.kelas})</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tanggal Kunjungan *</label>
              <input 
                type="date"
                value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Bidang Bimbingan *</label>
              <select 
                value={layanan} onChange={(e) => setLayanan(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-800"
              >
                <option value="">-- Pilih Bidang Bimbingan --</option>
                <option>Pribadi</option>
                <option>Sosial</option>
                <option>Akademik</option>
                <option>Karir</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Guru Pelaksana</label>
              <input 
                type="text"
                readOnly
                value={guru}
                className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-not-allowed"
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Hasil Kunjungan / Evaluasi *</label>
              <textarea 
                value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Catatan hasil percakapan dengan orang tua/wali, kondisi lingkungan siswa, kendala yang dihadapi..." 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium min-h-24"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Rencana Tindak Lanjut / Kesimpulan</label>
              <textarea 
                value={tindaklanjut} onChange={(e) => setTindaklanjut(e.target.value)}
                placeholder="Komitmen bersama orang tua, bimbingan lanjutan di sekolah, dsb..." 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium min-h-20"
              />
            </div>

            {/* DOKUMENTASI FOTO UPLOAD SECTION */}
            <div className="md:col-span-2 lg:col-span-3 bg-slate-50/75 p-5 rounded-2xl border border-dashed border-emerald-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Dokumentasi Foto Kunjungan Rumah</h3>
                    <p className="text-xs text-slate-500">Unggah foto kunjungan bersama siswa/orang tua (maks. 5 foto, otomatis dioptimalkan).</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  {fotoList.length} / 5 Foto Terpasang
                </div>
              </div>

              {/* Upload Action Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*" 
                  multiple
                  onChange={handleFileUpload}
                  className="hidden" 
                  id="foto-homevisit-upload"
                  disabled={isCompressing || fotoList.length >= 5}
                />
                <label 
                  htmlFor="foto-homevisit-upload"
                  className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    fotoList.length >= 5 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 hover:shadow-lg active:scale-95'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  {isCompressing ? 'Sedang Memproses Foto...' : 'Pilih / Ambil Foto'}
                </label>

                <span className="text-[11px] text-slate-400">
                  Mendukung JPG, PNG, WEBP (otomatis dikompresi agar hemat memori)
                </span>
              </div>

              {/* Photos Preview Grid */}
              {fotoList.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {fotoList.map((foto, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-200 aspect-video">
                      <img 
                        src={foto} 
                        alt={`Dokumentasi ${idx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLightboxData({
                            photos: fotoList,
                            index: idx,
                            title: 'Preview Foto Dokumentasi',
                            date: tanggal
                          })}
                          className="p-1.5 bg-white/90 text-slate-700 rounded-lg hover:bg-white"
                          title="Lihat Penuh"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFoto(idx)}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-md"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        #{idx + 1} • {getBase64SizeKb(foto)}KB
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 lg:col-span-3 flex items-center justify-between pt-2">
              <button 
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={isDeleting || isCompressing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 text-sm flex items-center gap-2"
              >
                {isDeleting ? 'Menyimpan Data...' : editingHV ? 'Simpan Perubahan' : 'Simpan Data Home Visit'}
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
                placeholder="Cari nama siswa atau guru..." 
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
            const photos = hv.foto || [];

            return (
              <div key={hv.id} className="bg-white border border-slate-200 hover:border-emerald-200 rounded-2xl shadow-xs hover:shadow-md transition-all group overflow-hidden flex flex-col">
                <div className="p-5 flex-1 space-y-4">
                  {/* Top Header Card */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">{targetSiswa.nama}</h3>
                        <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider">{targetSiswa.kelas}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {format(visitDate, 'MMMM yyyy', { locale: idID })}
                      </p>
                      <p className="font-bold text-slate-700 text-xs flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        {format(visitDate, 'dd-MM-yyyy', { locale: idID })}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {hv.layanan}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> {hv.guru}
                    </span>
                    {photos.length > 0 && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Camera className="w-3 h-3" /> {photos.length} Foto Dokumentasi
                      </span>
                    )}
                  </div>

                  {/* Keterangan */}
                  <div className="space-y-1 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Heart className="w-3 h-3 text-emerald-500" /> Hasil Evaluasi / Kunjungan:
                    </p>
                    <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">{hv.keterangan}</p>
                  </div>

                  {/* Tindak Lanjut */}
                  {hv.tindaklanjut && (
                    <div className="space-y-1 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                        Kesimpulan & Tindak Lanjut:
                      </p>
                      <p className="text-emerald-900 text-xs font-medium italic leading-relaxed whitespace-pre-line">
                        {hv.tindaklanjut}
                      </p>
                    </div>
                  )}

                  {/* DOKUMENTASI FOTO THUMBNAILS IN CARD */}
                  {photos.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                          <ImageIcon className="w-3 h-3 text-emerald-600" /> Bukti Dokumentasi ({photos.length})
                        </span>
                        <button 
                          onClick={() => setLightboxData({
                            photos,
                            index: 0,
                            title: `Dokumentasi Home Visit - ${targetSiswa.nama}`,
                            date: hv.tanggal
                          })}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                        >
                          Lihat Semua
                        </button>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {photos.map((foto, pIdx) => (
                          <div 
                            key={pIdx}
                            onClick={() => setLightboxData({
                              photos,
                              index: pIdx,
                              title: `Dokumentasi Home Visit - ${targetSiswa.nama}`,
                              date: hv.tanggal
                            })}
                            className="group/img relative rounded-xl overflow-hidden border border-slate-200 aspect-video cursor-pointer hover:shadow-md transition-all"
                          >
                            <img 
                              src={foto} 
                              alt={`Dokumentasi ${targetSiswa.nama} ${pIdx + 1}`} 
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-white drop-shadow" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="italic flex items-center gap-1">
                        <Camera className="w-3 h-3 text-slate-300" /> Belum ada foto dokumentasi
                      </span>
                      <button 
                        onClick={() => handleEdit(hv)}
                        className="text-emerald-600 font-bold hover:underline"
                      >
                        + Tambah Foto
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Actions Bottom */}
                <div className="bg-slate-50/80 px-4 py-2.5 flex items-center justify-between border-t border-slate-100">
                  <button 
                    onClick={() => setPrintHV(hv)}
                    className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white transition-all"
                    title="Cetak Laporan Home Visit"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Laporan
                  </button>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(hv)} 
                      className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-white rounded-lg transition-all" 
                      title="Edit Data & Foto"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteId(hv.id)} 
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all" 
                      title="Hapus Kunjungan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* LIGHTBOX / PHOTO VIEWER MODAL */}
      {lightboxData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold text-base text-slate-100">{lightboxData.title}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3 h-3 text-emerald-400" /> {lightboxData.date} • Foto ke {lightboxData.index + 1} dari {lightboxData.photos.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={lightboxData.photos[lightboxData.index]} 
                  download={`Dokumentasi-HomeVisit-${lightboxData.index + 1}.jpg`}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  title="Unduh Foto Ini"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button 
                  onClick={() => setLightboxData(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Active Image Stage */}
            <div className="relative flex-1 bg-black flex items-center justify-center p-4 overflow-hidden min-h-[300px] md:min-h-[450px]">
              <img 
                src={lightboxData.photos[lightboxData.index]} 
                alt="Dokumentasi Full View" 
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl select-none"
              />

              {/* Prev & Next arrows if multiple */}
              {lightboxData.photos.length > 1 && (
                <>
                  <button 
                    onClick={() => setLightboxData(prev => prev ? {
                      ...prev,
                      index: (prev.index - 1 + prev.photos.length) % prev.photos.length
                    } : null)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/70 hover:bg-slate-800 text-white rounded-full backdrop-blur-sm transition-all"
                    title="Foto Sebelumnya"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setLightboxData(prev => prev ? {
                      ...prev,
                      index: (prev.index + 1) % prev.photos.length
                    } : null)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-slate-900/70 hover:bg-slate-800 text-white rounded-full backdrop-blur-sm transition-all"
                    title="Foto Selanjutnya"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom thumbnail strip */}
            {lightboxData.photos.length > 1 && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 overflow-x-auto">
                {lightboxData.photos.map((p, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setLightboxData(prev => prev ? { ...prev, index: idx } : null)}
                    className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      lightboxData.index === idx ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINTABLE REPORT MODAL */}
      {printHV && (() => {
        const student = siswa.find(s => s.id === printHV.siswaId);
        const photos = printHV.foto || [];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-800">Format Laporan Home Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.print()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-100 transition-all"
                  >
                    <Printer className="w-4 h-4" /> Cetak Sekarang
                  </button>
                  <button 
                    onClick={() => setPrintHV(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Body */}
              <div className="p-8 overflow-y-auto space-y-6 text-slate-800 font-sans print:p-0 print:m-0">
                {/* School Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <BkLogo size="md" />
                    <div>
                      <h2 className="font-black text-lg text-slate-900 uppercase tracking-tight">SMA MUHAMMADIYAH SINGAPARNA</h2>
                      <p className="text-xs font-bold text-emerald-700 tracking-wide uppercase">Layanan Bimbingan dan Konseling (BK)</p>
                      <p className="text-[10px] text-slate-500">Jl. Panyingkiran No. 37, Singaparna, Kab. Tasikmalaya</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lampiran BK-03</span>
                  </div>
                </div>

                {/* Report Title */}
                <div className="text-center space-y-1">
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-900 underline">
                    LAPORAN PELAKSANAAN HOME VISIT (KUNJUNGAN RUMAH)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Nomor: HV/{format(new Date(printHV.tanggal), 'yyyy/MM')}/{printHV.id.substring(0, 5)}</p>
                </div>

                {/* Identity Table */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-500">Nama Siswa:</span>
                    <span className="col-span-2 font-bold text-slate-900">{student?.nama || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-500">Kelas / Jenis Kelamin:</span>
                    <span className="col-span-2 font-medium text-slate-900">{student?.kelas} / {student?.jk}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-500">Tanggal Kunjungan:</span>
                    <span className="col-span-2 font-medium text-slate-900">{format(new Date(printHV.tanggal), 'EEEE, dd MMMM yyyy', { locale: idID })}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-500">Bidang Bimbingan:</span>
                    <span className="col-span-2 font-medium text-slate-900">{printHV.layanan}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="font-bold text-slate-500">Guru BK Pelaksana:</span>
                    <span className="col-span-2 font-bold text-slate-900">{printHV.guru}</span>
                  </div>
                </div>

                {/* Contents */}
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1 border-b border-slate-200 pb-1">
                      A. Deskripsi Kondisi & Hasil Kunjungan:
                    </h4>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line p-2 bg-slate-50/50 rounded-lg">
                      {printHV.keterangan}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-1 border-b border-slate-200 pb-1">
                      B. Kesimpulan & Rencana Tindak Lanjut:
                    </h4>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line p-2 bg-slate-50/50 rounded-lg italic">
                      {printHV.tindaklanjut || 'Belum ada tindak lanjut khusus yang dicatat.'}
                    </p>
                  </div>

                  {/* LAMPIRAN DOKUMENTASI FOTO */}
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                      <span>C. Lampiran Dokumentasi Foto:</span>
                      <span className="text-[10px] text-slate-500 normal-case">{photos.length} Foto Terlampir</span>
                    </h4>
                    {photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {photos.map((foto, idx) => (
                          <div key={idx} className="border border-slate-300 rounded-lg p-1 bg-white">
                            <img 
                              src={foto} 
                              alt={`Dokumentasi ${idx + 1}`} 
                              className="w-full h-44 object-cover rounded" 
                            />
                            <p className="text-[9px] text-center text-slate-500 mt-1 font-mono">
                              Dokumentasi #{idx + 1} - Kunjungan {student?.nama}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px] p-3 text-center bg-slate-50 rounded-lg">
                        Tidak ada dokumentasi foto yang dilampirkan.
                      </p>
                    )}
                  </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                  <div className="space-y-16">
                    <p className="font-medium text-slate-600">Orang Tua / Wali Siswa,</p>
                    <p className="font-bold border-b border-slate-400 pb-1 w-44 mx-auto">( ............................................ )</p>
                  </div>
                  <div className="space-y-16">
                    <p className="font-medium text-slate-600">Guru Bimbingan Konseling,</p>
                    <p className="font-bold border-b border-slate-400 pb-1 w-44 mx-auto text-slate-900">{printHV.guru}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                Apakah Anda yakin ingin menghapus catatan home visit ini beserta seluruh dokumentasi fotonya? Tindakan ini tidak dapat dibatalkan.
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
