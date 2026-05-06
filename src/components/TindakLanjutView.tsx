import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  User, 
  Calendar,
  MessageSquare,
  Home,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Siswa, Konseling, HomeVisit } from '../types.ts';
import { format } from 'date-fns';
import { id as idID } from 'date-fns/locale';

interface TindakLanjutViewProps {
  konseling: Konseling[];
  homeVisit: HomeVisit[];
  siswa: Siswa[];
}

export default function TindakLanjutView({ konseling, homeVisit, siswa }: TindakLanjutViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Combine and filter follow-ups
  const allFollowUps = [
    ...konseling.filter(k => k.tindaklanjut).map(k => ({
      id: k.id,
      siswaId: k.siswaId,
      tanggal: k.tanggal,
      layanan: k.layanan,
      tipe: 'Konseling' as const,
      catatan: k.keterangan,
      tindaklanjut: k.tindaklanjut,
      guru: k.guru
    })),
    ...homeVisit.filter(hv => hv.tindaklanjut).map(hv => ({
      id: hv.id,
      siswaId: hv.siswaId,
      tanggal: hv.tanggal,
      layanan: hv.layanan,
      tipe: 'Home Visit' as const,
      catatan: hv.keterangan,
      tindaklanjut: hv.tindaklanjut,
      guru: hv.guru
    }))
  ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

  const filteredFollowUps = allFollowUps.filter(f => {
    const targetSiswa = siswa.find(s => s.id === f.siswaId);
    if (!targetSiswa) return false;
    return targetSiswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
           f.tindaklanjut.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Rencana Tindak Lanjut</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar seluruh rencana aksi hasil bimbingan dan kunjungan.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari siswa atau isi tindak lanjut..." 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
            />
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredFollowUps.length} Rencana Terpantau</div>
        </div>

        <div className="p-6 space-y-4">
          {filteredFollowUps.map((f) => {
            const s = siswa.find(item => item.id === f.siswaId);
            if (!s) return null;

            return (
              <div key={`${f.tipe}-${f.id}`} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border-l-4 border-l-indigo-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={f.tipe === 'Konseling' ? 'bg-blue-50 p-2 rounded-lg' : 'bg-emerald-50 p-2 rounded-lg'}>
                        {f.tipe === 'Konseling' ? <MessageSquare className="w-5 h-5 text-blue-600" /> : <Home className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{s.nama} <span className="text-slate-400 font-medium text-xs ml-2">({s.kelas})</span></h3>
                        <div className="flex items-center gap-4 mt-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {format(new Date(f.tanggal), 'dd MMM yyyy', { locale: idID })}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <User className="w-3 h-3" /> {f.guru}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hasil Bimbingan:</p>
                       <p className="text-slate-600 text-sm italic">"{f.catatan}"</p>
                    </div>
                  </div>

                  <div className="hidden lg:block">
                    <ArrowRight className="w-6 h-6 text-slate-200" />
                  </div>

                  <div className="flex-1">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 h-full">
                       <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Rencana Tindak Lanjut:</p>
                       </div>
                       <p className="text-indigo-900 font-bold text-sm leading-relaxed">{f.tindaklanjut}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredFollowUps.length === 0 && (
            <div className="py-20 text-center text-slate-400 italic">
              Tidak ada rencana tindak lanjut yang ditemukan
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
