import React from 'react';

interface BkLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

/**
 * Logo Resmi & Profesional Bimbingan dan Konseling (BK) MUDASPA
 * 
 * Filosofi Logo:
 * 1. Dua Tangan Merangkul / Sayap Pelindung (Nurturing Hands): Simbol kepedulian, empati, pendampingan, dan ruang aman (safe space) bagi siswa.
 * 2. Sosok Insan Berkembang (Flourishing Student): Simbol pertumbuhan pribadi, kemandirian, dan aktualisasi potensi siswa.
 * 3. Bintang Penuntun Masa Depan (Guiding Star): Arah cita-cita, pencerahan moral, solusi, dan masa depan yang cerah.
 * 4. Perisai Harmoni & Lingkaran Persaudaraan: Melindungi integritas, kerahasiaan konseling (asas kerahasiaan BK), dan persaudaraan Muhammadiyah.
 */
export default function BkLogo({ className = "w-10 h-10", size, ...props }: BkLogoProps) {
  const uniqueId = React.useId().replace(/:/g, '');
  const gradPrimary = `bk-grad-primary-${uniqueId}`;
  const gradAccent = `bk-grad-accent-${uniqueId}`;
  const gradGold = `bk-grad-gold-${uniqueId}`;
  const gradGlow = `bk-grad-glow-${uniqueId}`;

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      aria-label="Logo Bimbingan dan Konseling"
      {...props}
    >
      <defs>
        {/* Gradien Utama: Deep Indigo ke Royal Violet & Cyan */}
        <linearGradient id={gradPrimary} x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        {/* Gradien Aksen: Emerald to Cyan (Pertumbuhan & Ketenangan) */}
        <linearGradient id={gradAccent} x1="20" y1="90" x2="100" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>

        {/* Gradien Emas: Pencerahan, Harapan & Kebijaksanaan */}
        <linearGradient id={gradGold} x1="60" y1="10" x2="60" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Subtle radial aura */}
        <radialGradient id={gradGlow} cx="60" cy="55" r="45" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </radialGradient>

        <filter id={`shadow-${uniqueId}`} x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1E1B4B" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Latar Belakang Perisai Membulat Lembut Modern */}
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="28"
        fill={`url(#${gradPrimary})`}
      />

      {/* Subtle Inner Highlight Ring */}
      <rect
        x="8"
        y="8"
        width="104"
        height="104"
        rx="26"
        stroke="white"
        strokeOpacity="0.2"
        strokeWidth="1.5"
      />

      {/* Cahaya Lingkaran Aura Dalam */}
      <circle cx="60" cy="58" r="38" fill={`url(#${gradGlow})`} />

      {/* Grup Lambang BK Utama */}
      <g filter={`url(#shadow-${uniqueId})`}>
        {/* Tangan Peduli Kiri (Nurturing Hand & Wing Curve) */}
        <path
          d="M 28 76 C 28 92 48 98 60 98 C 50 90 42 80 40 68 C 38 56 46 45 48 40 C 42 45 34 52 30 62 C 28.5 66 28 71 28 76 Z"
          fill="white"
          fillOpacity="0.95"
        />

        {/* Tangan Peduli Kanan (Nurturing Hand & Wing Curve) */}
        <path
          d="M 92 76 C 92 92 72 98 60 98 C 70 90 78 80 80 68 C 82 56 74 45 72 40 C 78 45 86 52 90 62 C 91.5 66 92 71 92 76 Z"
          fill="white"
          fillOpacity="0.95"
        />

        {/* Lengkungan Penopang Bawah (Pondasi Kehangatan & Kasih Sayang) */}
        <path
          d="M 36 78 C 44 88 54 92 60 92 C 66 92 76 88 84 78 C 76 85 68 87 60 87 C 52 87 44 85 36 78 Z"
          fill={`url(#${gradAccent})`}
        />

        {/* Sosok Figur Siswa yang Berkembang & Bahagia di Tengah */}
        {/* Kepala Siswa */}
        <circle cx="60" cy="46" r="6.5" fill="white" />

        {/* Tubuh & Tangan Terangkat Siswa Menyambut Masa Depan */}
        <path
          d="M 60 55 C 53 55 49 61 47 70 C 51 68 56 67 60 67 C 64 67 69 68 73 70 C 71 61 67 55 60 55 Z"
          fill="white"
        />

        {/* Daun Tunas Potensi / Harapan di Bahu */}
        <path
          d="M 60 64 C 55 60 51 62 48 65 C 52 64 56 65 60 67 Z"
          fill={`url(#${gradAccent})`}
        />
        <path
          d="M 60 64 C 65 60 69 62 72 65 C 68 64 64 65 60 67 Z"
          fill={`url(#${gradAccent})`}
        />

        {/* Bintang Penuntun & Pencerahan Masa Depan (Guiding Star of BK) di Puncak */}
        {/* Cahaya Inti Bintang 8 Sudut */}
        <path
          d="M 60 17 L 62.2 26 L 69 23 L 64.5 28.5 L 72 32 L 63.8 33.5 L 67 40 L 60.5 36 L 60 41 L 59.5 36 L 53 40 L 56.2 33.5 L 48 32 L 55.5 28.5 L 51 23 L 57.8 26 Z"
          fill={`url(#${gradGold})`}
        />

        {/* Inti Pusat Bintang */}
        <circle cx="60" cy="30" r="3" fill="#FFFBEB" />
      </g>
    </svg>
  );
}
