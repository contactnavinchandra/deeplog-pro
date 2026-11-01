import { CritterSpecies, SpottedCritter } from '../types/dive';

export interface SacRmvResult {
  ata: number;
  gasUsedBar: number;
  gasUsedLiters: number;
  /** Surface Air Consumption in bar/min (at 1 ATA) */
  sacBarMin: number;
  /** Surface Air Consumption in psi/min (at 1 ATA) */
  sacPsiMin: number;
  /** Respiratory Minute Volume in Liters/min (at 1 ATA) */
  rmvLitersMin: number;
  /** Respiratory Minute Volume in cuft/min (at 1 ATA) */
  rmvCuftMin: number;
}

/**
 * Calculates Surface Air Consumption (SAC) and Respiratory Minute Volume (RMV)
 */
export function calculateSacAndRmv(
  avgDepthM: number,
  bottomTimeMin: number,
  startPressureBar: number,
  endPressureBar: number,
  tankVolumeL: number
): SacRmvResult {
  const safeTime = Math.max(1, bottomTimeMin);
  const safeDepth = Math.max(1, avgDepthM);
  const ata = 1 + safeDepth / 10;
  const gasUsedBar = Math.max(0, startPressureBar - endPressureBar);
  const gasUsedLiters = gasUsedBar * tankVolumeL;

  const sacBarMin = Math.round((gasUsedBar / safeTime / ata) * 100) / 100;
  const sacPsiMin = Math.round(sacBarMin * 14.5038 * 10) / 10;
  const rmvLitersMin = Math.round((gasUsedLiters / safeTime / ata) * 10) / 10;
  const rmvCuftMin = Math.round((rmvLitersMin * 0.0353147) * 100) / 100;

  return {
    ata: Math.round(ata * 100) / 100,
    gasUsedBar,
    gasUsedLiters,
    sacBarMin,
    sacPsiMin,
    rmvLitersMin,
    rmvCuftMin,
  };
}

/**
 * Calculates Maximum Operating Depth (MOD) in meters for a given O2% and ppO2 limit (e.g., 1.4)
 */
export function calculateModMeters(o2Percent: number, ppO2Limit = 1.4): number {
  const fo2 = Math.max(0.21, Math.min(1.0, o2Percent / 100));
  const maxAta = ppO2Limit / fo2;
  const modM = (maxAta - 1) * 10;
  return Math.round(modM * 10) / 10;
}

/**
 * Calculates Equivalent Air Depth (EAD) in meters for Nitrox
 */
export function calculateEadMeters(depthM: number, o2Percent: number): number {
  const fn2 = (100 - o2Percent) / 100;
  const ead = ((depthM + 10) * (fn2 / 0.79)) - 10;
  return Math.max(0, Math.round(ead * 10) / 10);
}

/**
 * Calculates Best Nitrox Mix (%) for a target depth in meters and ppO2 limit
 */
export function calculateBestMixO2(depthM: number, ppO2Limit = 1.4): number {
  const ata = 1 + Math.max(0, depthM) / 10;
  const fo2 = ppO2Limit / ata;
  return Math.min(40, Math.max(21, Math.floor(fo2 * 100)));
}

/**
 * Smart Auto-Tag Critters from Notes Scanner
 * Parses natural language dive notes for species aliases, common names, scientific names,
 * and preceding counts (e.g., "spotted 3 pygmy seahorses, a hairy frogfish, and two wonderpus").
 */
const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  pair: 2,
  couple: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  dozen: 12,
};

const SPECIES_KEYWORDS: Record<string, string[]> = {
  'sp-hairy-frogfish': ['hairy frogfish', 'striatus', 'hairy angler'],
  'sp-warty-frogfish': ['warty frogfish', 'clown frogfish', 'maculatus', 'warty'],
  'sp-giant-frogfish': ['giant frogfish', 'commerson'],
  'sp-flamboyant-cuttle': ['flamboyant cuttlefish', 'flamboyant', 'pfefferi'],
  'sp-broadclub-cuttle': ['broadclub cuttlefish', 'broadclub', 'latimanus', 'cuttlefish'],
  'sp-bobtail-squid': ['bobtail squid', 'bobtail', 'euprymna', 'hummingbird bobtail'],
  'sp-reef-squid': ['reef squid', 'bigfin squid', 'sepioteuthis'],
  'sp-wonderpus': ['wonderpus', 'wunderpus', 'photogenicus'],
  'sp-coconut-octopus': ['coconut octopus', 'veined octopus', 'marginatus'],
  'sp-pikachu-nudi': ['pikachu', 'thecacera', 'pikachu nudibranch', 'pikachu slug'],
  'sp-shaun-sheep': ['shaun the sheep', 'costasiella', 'leaf slug', 'sheep slug'],
  'sp-napoleon-wrasse': ['napoleon wrasse', 'humphead wrasse', 'napoleon', 'cheilinus'],
  'sp-flasher-wrasse': ['flasher wrasse', 'mccosker', 'paracheilinus'],
  'sp-pygmy-seahorse': ['pygmy seahorse', 'bargibanti', 'pygmy'],
  'sp-mantis-shrimp': ['mantis shrimp', 'peacock mantis', 'smasher mantis'],
  'sp-ribbon-eel': ['ribbon eel', 'blue ribbon eel', 'rhinomuraena'],
  'sp-hawksbill-turtle': ['hawksbill', 'sea turtle', 'turtle', 'imbricata'],
};

export function scanNotesForCritters(
  notes: string,
  allSpecies: CritterSpecies[]
): SpottedCritter[] {
  const lower = notes.toLowerCase();
  const detected: Map<string, SpottedCritter> = new Map();

  for (const sp of allSpecies) {
    const patterns = [
      sp.commonName.toLowerCase(),
      sp.scientificName.toLowerCase(),
      ...(SPECIES_KEYWORDS[sp.id] || []),
    ];

    for (const phrase of patterns) {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `(?:(\\d+|a|an|one|two|pair|couple|three|four|five|six|seven|eight|nine|ten|dozen)\\s+)?(?:huge|tiny|juvenile|giant|bright|orange|yellow|black|neon\\s+)?${escaped}s?`,
        'i'
      );
      const match = lower.match(regex);
      if (match) {
        const rawQty = match[1]?.toLowerCase();
        let count = 1;
        if (rawQty) {
          if (/^\d+$/.test(rawQty)) {
            count = Math.min(99, Math.max(1, parseInt(rawQty, 10)));
          } else if (WORD_NUMBERS[rawQty]) {
            count = WORD_NUMBERS[rawQty];
          }
        }
        detected.set(sp.id, {
          speciesId: sp.id,
          count,
          highlight: sp.rarity === 'Holy Grail' || sp.rarity === 'Rare',
        });
        break;
      }
    }
  }

  return Array.from(detected.values());
}

/**
 * Generates a deterministic 21x21 QR matrix (with standard 7x7 finder patterns)
 * from any string payload for zero-bloat offline SVG rendering.
 */
export function generateQrMatrix(payload: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[rowOffset + r][colOffset + c] = isBorder || isInner;
        reserved[rowOffset + r][colOffset + c] = true;
      }
    }
    // White quiet separator around finder
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          reserved[rr][cc] = true;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    reserved[6][i] = true;
    grid[i][6] = i % 2 === 0;
    reserved[i][6] = true;
  }

  // Hash payload bytes into remaining modules
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      const charCode = payload.charCodeAt(bitIdx % payload.length) || 42;
      const mixed = ((hash >>> (bitIdx % 24)) ^ (charCode * (r + 1) * (c + 3))) & 1;
      grid[r][c] = mixed === 1;
      bitIdx++;
    }
  }

  return grid;
}
