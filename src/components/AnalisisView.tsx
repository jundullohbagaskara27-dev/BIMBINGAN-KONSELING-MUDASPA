import React from 'react';
import { 
  BarChart3, 
  Users, 
  MessageCircle, 
  Home, 
  AlertTriangle, 
  AlertCircle,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Siswa, Konseling, HomeVisit, Pelanggaran, Keterlambatan, Settings } from '../types.ts';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

interface AnalisisViewProps {
  siswa: Siswa[];
  konseling: Konseling[];
  homeVisit: HomeVisit[];
  pelanggaran: Pelanggaran[];
  keterlambatan: Keterlambatan[];
  settings: Settings;
}

export default function AnalisisView({ siswa, konseling, homeVisit, pelanggaran, keterlambatan, settings }: AnalisisViewProps) {
  // 1. Analisis Per Guru (Konseling + Home Visit)
  const guru1Stats = {
    konseling: konseling.filter(k => k.guru === settings.guru1_nama).length,
    homevisit: homeVisit.filter(hv => hv.guru === settings.guru1_nama).length,
  };
  const guru2Stats = {
    konseling: konseling.filter(k => k.guru === settings.guru2_nama).length,
    homevisit: homeVisit.filter(hv => hv.guru === settings.guru2_nama).length,
  };

  const guruPieData = [
    { name: settings.guru1_nama, value: guru1Stats.konseling + guru1Stats.homevisit, color: '#6366f1' },
    { name: settings.guru2_nama, value: guru2Stats.konseling + guru2Stats.homevisit, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // 2. Analisis Layanan Konseling
  const layananData = [
    { name: 'Pribadi', value: konseling.filter(k => k.layanan === 'Pribadi').length, color: '#3b82f6' },
    { name: 'Sosial', value: konseling.filter(k => k.layanan === 'Sosial').length, color: '#10b981' },
    { name: 'Akademik', value: konseling.filter(k => k.layanan === 'Akademik').length, color: '#f59e0b' },
    { name: 'Karir', value: konseling.filter(k => k.layanan === 'Karir').length, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // 3. Jenis Pelanggaran Terbanyak
  const pelanggaranMap = new Map<string, number>();
  pelanggaran.forEach(p => {
    pelanggaranMap.set(p.jenis, (pelanggaranMap.get(p.jenis) || 0) + 1);
  });

  const topJenisPelanggaran = Array.from(pelanggaranMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 4. Siswa Teraktif (Aggregated)
  const activityMap = new Map<string, {
    pribadi: number,
    karir: number,
    akademik: number,
    sosial: number,
    homevisit: number,
    pelanggaran: number,
    terlambat: number,
    total: number
  }>();

  const getSiswaActivity = (id: string) => {
    if (!activityMap.has(id)) {
      activityMap.set(id, { pribadi: 0, karir: 0, akademik: 0, sosial: 0, homevisit: 0, pelanggaran: 0, terlambat: 0, total: 0 });
    }
    return activityMap.get(id)!;
  };

  konseling.forEach(k => {
    const act = getSiswaActivity(k.siswaId);
    if (k.layanan === 'Pribadi') act.pribadi++;
    else if (k.layanan === 'Karir') act.karir++;
    else if (k.layanan === 'Akademik') act.akademik++;
    else if (k.layanan === 'Sosial') act.sosial++;
    act.total++;
  });

  homeVisit.forEach(hv => {
    const act = getSiswaActivity(hv.siswaId);
    act.homevisit++;
    act.total++;
  });

  pelanggaran.forEach(p => {
    const act = getSiswaActivity(p.siswaId);
    act.pelanggaran++;
    act.total++;
  });

  keterlambatan.forEach(k => {
    const act = getSiswaActivity(k.siswaId);
    act.terlambat++;
    act.total++;
  });

  const topSiswaActivity = siswa
    .filter(s => activityMap.has(s.id))
    .map(s => ({ ...s, stats: activityMap.get(s.id)! }))
    .sort((a, b) => b.stats.total - a.stats.total)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analisis & Statistik Internal</h1>
        <p className="text-slate-500 text-sm mt-1">Laporan komprehensif efektivitas bimbingan dan peta kondisi siswa.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Statistik Guru */}
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200">
           <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-lg text-slate-800">Statistik Guru</h2>
            <PieChartIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={guruPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {guruPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribusi Layanan */}
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-lg text-slate-800">Distribusi Bidang Layanan</h2>
            <PieChartIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={layananData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {layananData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking Pelanggaran */}
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200">
          <h2 className="font-bold text-lg text-slate-800 mb-6">Peta Pelanggaran Tertinggi</h2>
          <div className="space-y-4">
            {topJenisPelanggaran.map((item, idx) => {
              const percentage = Math.round((item.value / pelanggaran.length) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-slate-600 line-clamp-1">{idx + 1}. {item.name}</span>
                    <span className="text-rose-600">{item.value} Insiden</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
            {topJenisPelanggaran.length === 0 && <p className="text-center py-10 text-slate-400 italic">Belum ada data</p>}
          </div>
        </div>

        {/* Siswa Teraktif Bimbingan */}
        <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-200">
          <h2 className="font-bold text-lg text-slate-800 mb-6">Siswa Teraktif Bimbingan</h2>
          <div className="space-y-4">
            {topSiswaActivity.map((s, idx) => (
              <div key={s.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shadow-sm text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{s.nama}</p>
                      <p className="text-slate-400 text-[10px] items-center flex gap-1 font-medium"><Users className="w-2.5 h-2.5" /> {s.kelas}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-600 font-black text-xl">{s.stats.total}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Total</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Pribadi</p>
                    <p className="text-xs font-black text-blue-500">{s.stats.pribadi}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Karir</p>
                    <p className="text-xs font-black text-indigo-500">{s.stats.karir}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Akademik</p>
                    <p className="text-xs font-black text-amber-500">{s.stats.akademik}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Sosial</p>
                    <p className="text-xs font-black text-emerald-500">{s.stats.sosial}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Home Visit</p>
                    <p className="text-xs font-black text-pink-500">{s.stats.homevisit}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Pelanggaran</p>
                    <p className="text-xs font-black text-rose-500">{s.stats.pelanggaran}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Terlambat</p>
                    <p className="text-xs font-black text-orange-500">{s.stats.terlambat}</p>
                  </div>
                </div>
              </div>
            ))}
            {topSiswaActivity.length === 0 && <p className="text-center py-10 text-slate-400 italic">Belum ada data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
