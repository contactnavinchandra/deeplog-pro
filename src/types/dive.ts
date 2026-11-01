export type UnitSystem = 'metric' | 'imperial';

export type PhotoStorageMode = 'app-compressed' | 'phone-link';

export type TabId = 'dives' | 'log' | 'gear' | 'critters' | 'stats';

export type CritterFamilyId =
  | 'frogfish'
  | 'cuttlefish'
  | 'squid'
  | 'octopus'
  | 'nudibranch'
  | 'wrasse'
  | 'seahorse'
  | 'shrimp'
  | 'moray'
  | 'turtle';

export interface CritterFamilyMeta {
  id: CritterFamilyId;
  name: string;
  taxonomy: string;
  accentColor: string;
  badgeBg: string;
  description: string;
}

export interface CritterSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  familyId: CritterFamilyId;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Holy Grail';
  typicalDepthM: string;
  habitat: string;
  description: string;
}

export interface SpottedCritter {
  speciesId: string;
  count: number;
  highlight?: boolean;
}

export interface VaultPhoto {
  id: string;
  diveNumber: number;
  caption: string;
  timestamp: string;
  vaultWebpDataUrl: string;
  originalPhoneUri: string;
  originalSizeKB: number;
  vaultSizeKB: number;
  width: number;
  height: number;
  isUserUploaded?: boolean;
  storageMode?: PhotoStorageMode;
}

export interface DiveCertification {
  id: string;
  agency: string;
  title: string;
  certNumber?: string;
  year?: string;
}

export interface GearCategory {
  id: string;
  name: string;
  items: string[];
}

export interface DiveTrip {
  id: string;
  /** Destination / Trip Name, e.g., 'Bali', 'Raja Ampat', 'Phuket', 'Cairns' */
  destination: string;
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
  /** Dive buddies who are part of this trip */
  buddies: string[];
  /** Gear items packed/brought from the Gear Locker for this trip */
  gearBrought?: string[];
}

export interface DiveRecord {
  id: string;
  diveNumber: number;
  /** Optional trip folder ID. If undefined/empty, sits outside trips as a standalone/local dive */
  tripId?: string;
  siteName: string;
  /** Location / Region (e.g., 'Padang Bai, Bali' or 'Brisbane') */
  subLocation: string;
  operator: string;
  date: string;
  timeIn: string;
  maxDepthM: number;
  avgDepthM: number;
  bottomTimeMin: number;
  startPressureBar: number;
  endPressureBar: number;
  tankVolumeL: number;
  gasMix: string;
  o2Percent: number;
  waterTempC: number;
  visibilityM: number;
  diveType: 'Boat' | 'Shore';
  dayNight?: 'Day' | 'Night';
  waterType?: 'Salt' | 'Fresh';
  current: 'Calm' | 'Mild' | 'Medium' | 'Moderate' | 'Strong';
  buddies: string[];
  diveGuide: string;
  gearUsed: string[];
  notes: string;
  critters: SpottedCritter[];
  coverPhotoId: string;
  photoIds: string[];
  computerModel: string;
  safetyStopMin: number;
  safetyStopsCount?: number;
}
