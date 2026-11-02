export interface Siswa {
  id: string;
  nama: string;
  nisn?: string;
  kelas: string;
  jk: 'Laki-laki' | 'Perempuan';
  createdAt: string;
}

export interface Konseling {
  id: string;
  siswaId: string;
  tanggal: string;
  layanan: string;
  guru: string;
  keterangan: string;
  tindaklanjut: string;
  createdAt: string;
}

export interface HomeVisit {
  id: string;
  siswaId: string;
  tanggal: string;
  layanan: string;
  guru: string;
  keterangan: string;
  tindaklanjut: string;
  foto?: string[];
  createdAt: string;
}

export interface Pelanggaran {
  id: string;
  siswaId: string;
  tanggal: string;
  jenis: string;
  keterangan: string;
  createdAt: string;
}

export interface Keterlambatan {
  id: string;
  siswaId: string;
  tanggal: string;
  createdAt: string;
}

export interface Settings {
  guru_nama: string;
  guru1_nama?: string;
  guru2_nama?: string;
}

export const DAFTAR_KELAS_MUDASPA = [
  'X-1',
  'X-2',
  'X-3',
  'XI-1',
  'XI-2',
  'XII-1',
  'XII-2',
  'XII-3'
];
