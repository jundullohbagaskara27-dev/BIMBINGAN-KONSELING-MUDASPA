import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  MessageCircle, 
  Home, 
  AlertCircle, 
  Settings as SettingsIcon, 
  BarChart3, 
  LogOut,
  ClipboardCheck,
  FolderOpen
} from 'lucide-react';
import { cn } from '../lib/utils.ts';

type Page = 'dashboard' | 'siswa' | 'pelanggaran' | 'konseling' | 'homevisit' | 'keterlambatan' | 'pengaturan' | 'analisis' | 'tindaklanjut';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: any) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'siswa', label: 'Data Siswa', icon: Users },
    { id: 'pelanggaran', label: 'Pelanggaran', icon: AlertTriangle },
    { id: 'konseling', label: 'Konseling', icon: MessageCircle },
    { id: 'homevisit', label: 'Home Visit', icon: Home },
    { id: 'tindaklanjut', label: 'Tindak Lanjut', icon: ClipboardCheck },
    { id: 'keterlambatan', label: 'Terlambat', icon: AlertCircle },
    { id: 'analisis', label: 'Analisis', icon: BarChart3 },
    { id: 'pengaturan', label: 'Pengaturan', icon: SettingsIcon },
  ];

  const handleGDriveClick = () => {
    window.open('https://drive.google.com/drive/folders/1dAnF3HoNoWbBl2GJ3uM81MJfKI_RRG3c?usp=drive_link', '_blank');
  };

  return (
    <aside className="w-20 lg:w-72 bg-indigo-900 h-screen flex flex-col shadow-2xl transition-all duration-300">
      <div className="p-6 border-b border-indigo-800 hidden lg:block">
        <h2 className="font-black text-2xl text-white tracking-tight">BK MUDASPA</h2>
        <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1">Sistem Bimbingan Konseling</p>
      </div>

      <nav className="flex-1 p-3 lg:p-4 space-y-2 overflow-y-auto">
         <div className="hidden lg:block px-4 py-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Main Menu</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 lg:px-4 lg:py-3 rounded-xl transition-all duration-200 group",
              currentPage === item.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" 
                : "text-indigo-300 hover:bg-indigo-800 hover:text-white"
            )}
            title={item.label}
          >
            <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", currentPage === item.id ? "text-white" : "text-indigo-400")} />
            <span className="hidden lg:inline font-medium">{item.label}</span>
            {currentPage === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white hidden lg:block" />
            )}
          </button>
        ))}

        <div className="h-px bg-indigo-800 my-4 hidden lg:block" />
        <div className="hidden lg:block px-4 py-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Arsip & Dokumen</div>
        
        <button
          onClick={handleGDriveClick}
          className="w-full flex items-center gap-3 p-3 lg:px-4 lg:py-3 rounded-xl text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all duration-200 group"
          title="Upload Dokumen (GDrive)"
        >
          <FolderOpen className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="hidden lg:inline font-medium">Upload Dokumen</span>
        </button>
      </nav>

      <div className="p-3 lg:p-4 border-t border-indigo-800">
        <button 
          onClick={() => {
            if (confirm("Apakah Anda yakin ingin keluar?")) onLogout();
          }}
          className="w-full flex items-center gap-3 p-3 lg:px-4 lg:py-3 rounded-xl text-indigo-300 hover:bg-red-600 hover:text-white transition-all duration-200"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:inline font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
