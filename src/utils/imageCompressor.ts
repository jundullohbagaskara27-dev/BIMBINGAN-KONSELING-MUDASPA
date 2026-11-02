/**
 * Client-side image compressor for Firestore storage.
 * Compresses images to compact JPEG base64 strings so records remain well below Firestore's 1MB limit.
 */
export async function compressImage(
  file: File, 
  maxWidth = 1024, 
  maxHeight = 1024, 
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio-preserving dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal membuat context canvas 2D'));
          return;
        }

        // Draw and compress to jpeg
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Format file tidak didukung'));
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculates human-readable base64 size in KB
 */
export function getBase64SizeKb(dataUrl: string): number {
  const head = 'data:image/jpeg;base64,';
  const len = dataUrl.startsWith('data:') ? dataUrl.length - (dataUrl.indexOf(',') + 1) : dataUrl.length;
  return Math.round((len * 3) / 4 / 1024);
}
