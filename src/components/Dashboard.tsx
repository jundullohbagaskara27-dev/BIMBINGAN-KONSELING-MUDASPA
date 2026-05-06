import React from 'react';
import { 
  Users, 
  MessageCircle, 
  Home, 
  AlertTriangle, 
  AlertCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Siswa, Konseling, HomeVisit, Pelanggaran, Keterlambatan } from '../types.ts';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface DashboardProps {
  siswa: Siswa[];
  konseling: Konseling[];
  homeVisit: HomeVisit[];
  pelanggaran: Pelanggaran[];
  keterlambatan: Keterlambatan[];
}

export default function Dashboard({ siswa, konseling, homeVisit, pelanggaran, keterlambatan }: DashboardProps) {
  const stats = [
    { label: 'Total Siswa', value: siswa.length, icon: Users, color: 'indigo' },
    { label: 'Konseling', value: konseling.length, icon: MessageCircle, color: 'blue' },
    { label: 'Home Visit', value: homeVisit.length, icon: Home, color: 'emerald' },
    { label: 'Pelanggaran', value: pelanggaran.length, icon: AlertTriangle, color: 'rose' },
    { label: 'Terlambat', value: keterlambatan.length, icon: AlertCircle, color: 'orange' },
  ];

  const chartData = [
    { name: 'Konseling', value: konseling.length, color: '#3b82f6' },
    { name: 'Home Visit', value: homeVisit.length, color: '#10b981' },
    { name: 'Pelanggaran', value: pelanggaran.length, color: '#f43f5e' },
    { name: 'Terlambat', value: keterlambatan.length, color: '#f97316' },
  ];

  // Hitung keterlambatan per siswa
  const keterlambatanMap = new Map<string, number>();
  keterlambatan.forEach(k => {
    keterlambatanMap.set(k.siswaId, (keterlambatanMap.get(k.siswaId) || 0) + 1);
  });

  const topSiswaTerlambat = siswa
    .filter(s => keterlambatanMap.has(s.id))
    .map(s => ({ ...s, count: keterlambatanMap.get(s.id) || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Selamat datang di sistem manajemen BK SMA MUDASPA.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-xs border border-slate-200">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-700">{siswa.length} Siswa Terdaftar</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 hover:shadow-md transition-shadow group">
            <div className={`p-3 rounded-xl inline-flex mb-4 transition-colors bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Aktivitas Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-lg text-slate-900">Aktivitas Bimbingan</h2>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Siswa Terlambat */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-bold text-lg text-slate-900">Top Keterlambatan</h2>
            <AlertCircle className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-4">
            {topSiswaTerlambat.length > 0 ? (
              topSiswaTerlambat.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-indigo-600 shadow-xs border border-slate-100">
                      {s.nama.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{s.nama}</p>
                      <p className="text-slate-500 text-xs">{s.kelas}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-rose-600">{s.count}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kali</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                   <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm italic">Belum ada data keterlambatan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
