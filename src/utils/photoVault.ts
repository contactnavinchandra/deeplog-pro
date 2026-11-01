import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface CompressionResult {
  webpDataUrl: string;
  originalSizeKB: number;
  vaultSizeKB: number;
  width: number;
  height: number;
  nativeVaultUri?: string;
}

/**
 * Persists a compressed WebP DataURL directly into Android/iOS native Directory.Data
 * when running inside the Capacitor shell.
 */
export async function saveWebpToNativeDirectoryData(
  fileName: string,
  webpDataUrl: string
): Promise<string | undefined> {
  if (!Capacitor.isNativePlatform()) {
    return undefined;
  }
  try {
    const base64Data = webpDataUrl.split(',')[1] || webpDataUrl;
    const result = await Filesystem.writeFile({
      path: `vault_photos/${fileName}`,
      data: base64Data,
      directory: Directory.Data,
      recursive: true,
    });
    return result.uri;
  } catch {
    return undefined;
  }
}

/**
 * Computes approximate binary byte size from a data URL
 */
export function getDataUrlSizeKB(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(';base64,');
  if (base64Index === -1) {
    return Math.round((new Blob([dataUrl]).size / 1024) * 10) / 10;
  }
  const base64 = dataUrl.slice(base64Index + 8);
  const byteLength = (base64.length * 3) / 4;
  return Math.max(8, Math.round((byteLength / 1024) * 10) / 10);
}

/**
 * Compresses an uploaded image File via HTML5 Canvas into a ~35KB WebP DataURL
 * suitable for offline Capacitor Directory.Data storage.
 */
export async function compressPhotoToWebpVault(
  file: File,
  targetKB = 35
): Promise<CompressionResult> {
  const originalSizeKB = Math.max(1, Math.round(file.size / 1024));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        const maxDim = 860;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Minimalist Leica-style metadata stamp
        ctx.fillStyle = 'rgba(9, 9, 11, 0.55)';
        ctx.fillRect(width - 175, height - 26, 167, 20);
        ctx.font = '600 10px monospace';
        ctx.fillStyle = '#f4f4f5';
        ctx.fillText('VAULT // Directory.Data WebP', width - 168, height - 12);

        let quality = 0.76;
        let webpDataUrl = canvas.toDataURL('image/webp', quality);
        let vaultSizeKB = getDataUrlSizeKB(webpDataUrl);

        while (vaultSizeKB > targetKB + 12 && quality > 0.28) {
          quality -= 0.1;
          webpDataUrl = canvas.toDataURL('image/webp', quality);
          vaultSizeKB = getDataUrlSizeKB(webpDataUrl);
        }

        const safeName = `vault_${Date.now()}.webp`;
        saveWebpToNativeDirectoryData(safeName, webpDataUrl).then((nativeVaultUri) => {
          resolve({
            webpDataUrl,
            originalSizeKB,
            vaultSizeKB,
            width,
            height,
            nativeVaultUri,
          });
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface ScenePreset {
  diveNumber: number;
  title: string;
  palette: [string, string, string];
  accent: string;
  subject: 'frogfish' | 'wreck' | 'cuttlefish' | 'octopus' | 'nudibranch' | 'reef' | 'manta' | 'night';
  depthText: string;
}

const SCENE_PRESETS: Record<number, ScenePreset> = {
  222: {
    diveNumber: 222,
    title: 'Blue Lagoon Jetty — Hairy Frogfish Macro',
    palette: ['#18181b', '#27272a', '#09090b'],
    accent: '#e4e4e7',
    subject: 'frogfish',
    depthText: '18.4m • f/8 • 1/160s • ISO 100 • Dual Inon Z-330',
  },
  221: {
    diveNumber: 221,
    title: 'Jepun Wreck & Artificial Reef — Broadclub Cuttlefish',
    palette: ['#1f2937', '#374151', '#111827'],
    accent: '#f3f4f6',
    subject: 'cuttlefish',
    depthText: '24.2m • f/5.6 • 1/125s • ISO 160 • Wreck Strobe',
  },
  220: {
    diveNumber: 220,
    title: 'Bias Tugel Wall — Wonderpus & Ribbon Eel',
    palette: ['#18181b', '#3f3f46', '#09090b'],
    accent: '#f4f4f5',
    subject: 'octopus',
    depthText: '26.8m • f/7.1 • 1/200s • ISO 100 • TG-6 + Backscatter',
  },
  219: {
    diveNumber: 219,
    title: 'USAT Liberty Wreck (Tulamben) — Bumphead Patrol',
    palette: ['#1e293b', '#334155', '#0f172a'],
    accent: '#e2e8f0',
    subject: 'wreck',
    depthText: '28.5m • f/6.3 • 1/250s • ISO 200 • Wide Dome',
  },
  218: {
    diveNumber: 218,
    title: 'Seraya Secrets — Pikachu Nudibranch (Thecacera)',
    palette: ['#09090b', '#27272a', '#18181b'],
    accent: '#fafafa',
    subject: 'nudibranch',
    depthText: '15.6m • f/16 • 1/200s • ISO 100 • SMC-1 Supermacro',
  },
  217: {
    diveNumber: 217,
    title: 'Ferry Channel Drift — Giant Frogfish & Reef Sharks',
    palette: ['#18181b', '#27272a', '#09090b'],
    accent: '#d4d4d8',
    subject: 'reef',
    depthText: '31.2m • f/8 • 1/160s • ISO 125 • Current Hook',
  },
  216: {
    diveNumber: 216,
    title: 'Drop Off Tulamben — Pygmy Seahorse on Gorgonian',
    palette: ['#1c1917', '#292524', '#0c0a09'],
    accent: '#e7e5e4',
    subject: 'nudibranch',
    depthText: '29.4m • f/14 • 1/200s • ISO 100 • Snoot Strobe',
  },
  215: {
    diveNumber: 215,
    title: 'Padang Bai Night Muck — Bobtail Squid Bioluminescence',
    palette: ['#09090b', '#18181b', '#09090b'],
    accent: '#e4e4e7',
    subject: 'night',
    depthText: '14.2m • f/11 • 1/200s • ISO 100 • Focus Light',
  },
};

export function generateVaultWebpForDive(diveNumber: number): {
  webpDataUrl: string;
  vaultSizeKB: number;
  width: number;
  height: number;
} {
  const preset = SCENE_PRESETS[diveNumber] || SCENE_PRESETS[222];
  const width = 800;
  const height = 420;

  if (typeof document === 'undefined') {
    return { webpDataUrl: '', vaultSizeKB: 34.2, width: 800, height: 420 };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { webpDataUrl: '', vaultSizeKB: 34.2, width, height };
  }

  // Editorial monochrome black-water gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, preset.palette[0]);
  bgGrad.addColorStop(0.55, preset.palette[1]);
  bgGrad.addColorStop(1, preset.palette[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle silver light rays from surface
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.beginPath();
    const startX = 120 + i * 110;
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX - 90 - i * 15, height);
    ctx.lineTo(startX + 70 + i * 10, height);
    ctx.closePath();
    const rayGrad = ctx.createLinearGradient(startX, 0, startX, height);
    rayGrad.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    rayGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
    rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rayGrad;
    ctx.fill();
    ctx.restore();
  }

  // Volcanic Bali slope silhouette
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, height - 95);
  ctx.bezierCurveTo(180, height - 140, 320, height - 55, 510, height - 105);
  ctx.bezierCurveTo(640, height - 135, 730, height - 80, width, height - 110);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = 'rgba(9, 9, 11, 0.78)';
  ctx.fill();

  // Fine film grain / backscatter particles for realistic ~34KB WebP compression
  const seedBase = diveNumber * 137;
  for (let i = 0; i < 420; i++) {
    const px = (seedBase + i * 7919) % width;
    const py = (seedBase + i * 6271) % height;
    const r = i % 4 === 0 ? 1.8 : 1.0;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle =
      i % 5 === 0
        ? 'rgba(255, 255, 255, 0.22)'
        : 'rgba(161, 161, 170, 0.14)';
    ctx.fill();
  }

  // Central macro strobe spotlight
  const glow = ctx.createRadialGradient(
    width * 0.52,
    height * 0.52,
    15,
    width * 0.52,
    height * 0.52,
    190
  );
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Fine-line botanical/taxonomic subject contour
  ctx.save();
  ctx.translate(width * 0.52, height * 0.54);
  ctx.strokeStyle = preset.accent;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2.2;

  if (preset.subject === 'frogfish') {
    ctx.beginPath();
    ctx.ellipse(0, 10, 68, 52, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-45, -18);
    ctx.quadraticCurveTo(-75, -65, -95, -45);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-98, -43, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  } else if (preset.subject === 'cuttlefish' || preset.subject === 'night') {
    ctx.beginPath();
    ctx.ellipse(-10, 0, 78, 38, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let t = -3; t <= 3; t++) {
      ctx.beginPath();
      ctx.moveTo(65, t * 6);
      ctx.quadraticCurveTo(95, t * 10 + 8, 120, t * 5);
      ctx.stroke();
    }
  } else if (preset.subject === 'octopus') {
    ctx.beginPath();
    ctx.arc(0, -22, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let a = 0; a < 8; a++) {
      const angle = (a / 7) * Math.PI - Math.PI * 0.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 20, 0);
      ctx.quadraticCurveTo(
        Math.cos(angle) * 75,
        45 + (a % 2) * 20,
        Math.cos(angle) * 125,
        25
      );
      ctx.stroke();
    }
  } else {
    for (let f = 0; f < 14; f++) {
      const fx = Math.cos(f * 1.1) * 110;
      const fy = Math.sin(f * 1.7) * 55;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 16, 8, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();

  // Viewfinder brackets
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  const pad = 22;
  const len = 16;
  ctx.beginPath();
  ctx.moveTo(pad, pad + len);
  ctx.lineTo(pad, pad);
  ctx.lineTo(pad + len, pad);
  ctx.moveTo(width - pad - len, pad);
  ctx.lineTo(width - pad, pad);
  ctx.lineTo(width - pad, pad + len);
  ctx.moveTo(pad, height - pad - len);
  ctx.lineTo(pad, height - pad);
  ctx.lineTo(pad + len, height - pad);
  ctx.moveTo(width - pad - len, height - pad);
  ctx.lineTo(width - pad, height - pad);
  ctx.lineTo(width - pad, height - pad - len);
  ctx.stroke();

  const webpDataUrl = canvas.toDataURL('image/webp', 0.82);
  const vaultSizeKB = getDataUrlSizeKB(webpDataUrl);

  return {
    webpDataUrl,
    vaultSizeKB,
    width,
    height,
  };
}
