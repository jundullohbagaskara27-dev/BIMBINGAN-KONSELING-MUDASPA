export interface Siswa {
  id: string;
  nama: string;
  nisn: string;
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
  guru1_nama: string;
  guru2_nama: string;
}
