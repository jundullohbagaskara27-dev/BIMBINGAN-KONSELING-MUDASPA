import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './lib/firebase.ts';
import { Siswa, Konseling, HomeVisit, Pelanggaran, Keterlambatan, Settings } from './types.ts';
import Login from './components/Login.tsx';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import SiswaView from './components/SiswaView.tsx';
import KonselingView from './components/KonselingView.tsx';
import HomeVisitView from './components/HomeVisitView.tsx';
import PelanggaranView from './components/PelanggaranView.tsx';
import KeterlambatanView from './components/KeterlambatanView.tsx';
import SettingsView from './components/SettingsView.tsx';
import AnalisisView from './components/AnalisisView.tsx';
import TindakLanjutView from './components/TindakLanjutView.tsx';
import { motion, AnimatePresence } from 'motion/react';

type Page = 'dashboard' | 'siswa' | 'pelanggaran' | 'konseling' | 'homevisit' | 'keterlambatan' | 'pengaturan' | 'analisis' | 'tindaklanjut';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [konseling, setKonseling] = useState<Konseling[]>([]);
  const [homeVisit, setHomeVisit] = useState<HomeVisit[]>([]);
  const [pelanggaran, setPelanggaran] = useState<Pelanggaran[]>([]);
  const [keterlambatan, setKeterlambatan] = useState<Keterlambatan[]>([]);
  const [settings, setSettings] = useState<Settings>({
    guru1_nama: 'Jundi Jundulloh',
    guru2_nama: 'Reni Anggraeni'
  });

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubSiswa = onSnapshot(query(collection(db, 'siswa'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        setSiswa(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Siswa)));
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, 'siswa')
    );

    const unsubKonseling = onSnapshot(query(collection(db, 'konseling'), orderBy('tanggal', 'desc')), 
      (snapshot) => {
        setKonseling(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Konseling)));
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, 'konseling')
    );

    const unsubHomeVisit = onSnapshot(query(collection(db, 'homevisit'), orderBy('tanggal', 'desc')), 
      (snapshot) => {
        setHomeVisit(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HomeVisit)));
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, 'homevisit')
    );

    const unsubPelanggaran = onSnapshot(query(collection(db, 'pelanggaran'), orderBy('tanggal', 'desc')), 
      (snapshot) => {
        setPelanggaran(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pelanggaran)));
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, 'pelanggaran')
    );

    const unsubKeterlambatan = onSnapshot(query(collection(db, 'keterlambatan'), orderBy('tanggal', 'desc')), 
      (snapshot) => {
        setKeterlambatan(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Keterlambatan)));
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, 'keterlambatan')
    );

    const unsubSettings = onSnapshot(doc(db, 'settings', 'config'), 
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as Settings);
        }
      }, 
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/config')
    );

    return () => {
      unsubSiswa();
      unsubKonseling();
      unsubHomeVisit();
      unsubPelanggaran();
      unsubKeterlambatan();
      unsubSettings();
    };
  }, []);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard siswa={siswa} konseling={konseling} homeVisit={homeVisit} pelanggaran={pelanggaran} keterlambatan={keterlambatan} />;
      case 'siswa':
        return <SiswaView siswa={siswa} />;
      case 'konseling':
        return <KonselingView konseling={konseling} siswa={siswa} settings={settings} />;
      case 'homevisit':
        return <HomeVisitView homeVisit={homeVisit} siswa={siswa} settings={settings} />;
      case 'pelanggaran':
        return <PelanggaranView pelanggaran={pelanggaran} siswa={siswa} />;
      case 'keterlambatan':
        return <KeterlambatanView keterlambatan={keterlambatan} siswa={siswa} />;
      case 'tindaklanjut':
        return <TindakLanjutView konseling={konseling} homeVisit={homeVisit} siswa={siswa} />;
      case 'pengaturan':
        return <SettingsView 
          settings={settings} 
          siswa={siswa}
          konseling={konseling}
          homeVisit={homeVisit}
          pelanggaran={pelanggaran}
          keterlambatan={keterlambatan}
          allDataCount={siswa.length + konseling.length + homeVisit.length + pelanggaran.length + keterlambatan.length} 
        />;
      case 'analisis':
        return <AnalisisView siswa={siswa} konseling={konseling} homeVisit={homeVisit} pelanggaran={pelanggaran} keterlambatan={keterlambatan} settings={settings} />;
      default:
        return <Dashboard siswa={siswa} konseling={konseling} homeVisit={homeVisit} pelanggaran={pelanggaran} keterlambatan={keterlambatan} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onLogout={() => setIsLoggedIn(false)} />
      
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="flex-1 p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <footer className="bg-slate-800 text-slate-400 py-4 text-center text-xs">
          © {new Date().getFullYear()} Jundi Jundulloh - BK SMA MUDASPA
        </footer>
      </main>
    </div>
  );
}
