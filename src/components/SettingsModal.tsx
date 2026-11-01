import React, { useRef, useState } from 'react';
import {
  X,
  Check,
  Database,
  Ruler,
  ChevronRight,
  ChevronLeft,
  HardDrive,
  Image as ImageIcon,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Hash,
} from 'lucide-react';
import {
  DiveRecord,
  DiveTrip,
  PhotoStorageMode,
  UnitSystem,
  VaultPhoto,
} from '../types/dive';

interface SettingsModalProps {
  unitSystem: UnitSystem;
  onChangeUnitSystem: (unit: UnitSystem) => void;
  initialDiveCount: number;
  onChangeInitialDiveCount: (count: number) => void;
  photoStorageMode: PhotoStorageMode;
  onChangePhotoStorageMode: (mode: PhotoStorageMode) => void;
  dives: DiveRecord[];
  trips: DiveTrip[];
  buddyPool: string[];
  gearLocker: string[];
  vaultPhotos: Record<string, VaultPhoto>;
  onConvertLinkedPhotosToApp: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  unitSystem,
  onChangeUnitSystem,
  initialDiveCount,
  onChangeInitialDiveCount,
  photoStorageMode,
  onChangePhotoStorageMode,
  dives,
  trips,
  buddyPool,
  gearLocker,
  vaultPhotos,
  onConvertLinkedPhotosToApp,
  onExportBackup,
  onImportBackup,
  onClose,
}) => {
  const [page, setPage] = useState<'main' | 'data'>('main');
  const [draftInitialDives, setDraftInitialDives] = useState<string>(
    String(initialDiveCount)
  );
  const importInputRef = useRef<HTMLInputElement | null>(null);

  // Calculate live storage metrics
  const allPhotos = Object.values(vaultPhotos);
  const appStoredPhotos = allPhotos.filter(
    (p) => (p.storageMode || 'app-compressed') === 'app-compressed'
  );
  const phoneLinkedPhotos = allPhotos.filter(
    (p) => p.storageMode === 'phone-link'
  );

  const photoStorageKB = Math.round(
    appStoredPhotos.reduce((sum, p) => sum + (p.vaultSizeKB || 34), 0)
  );

  const logDataString = JSON.stringify({
    dives,
    trips,
    buddyPool,
    gearLocker,
  });
  const logDataKB = Math.max(
    4,
    Math.round((logDataString.length / 1024) * 10) / 10
  );

  const totalAppKB = Math.round((photoStorageKB + logDataKB) * 10) / 10;
  const totalAppDisplay =
    totalAppKB >= 1024
      ? `${(totalAppKB / 1024).toFixed(2)} MB`
      : `${totalAppKB} KB`;

  const parsedInitialDives = Math.max(
    0,
    Math.floor(Number(draftInitialDives) || 0)
  );
  const firstAppDiveNumber = parsedInitialDives + 1;
  const latestAppDiveNumber = parsedInitialDives + dives.length;

  const handleApplyInitialDives = () => {
    onChangeInitialDiveCount(parsedInitialDives);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportBackup(file);
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-end justify-center">
      <div className="w-full max-h-[88%] bg-white rounded-t-3xl border-t border-zinc-200 flex flex-col shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="px-5 pt-4 pb-3 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {page === 'data' && (
              <button
                type="button"
                onClick={() => setPage('main')}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700"
                aria-label="Back to settings"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-base font-bold text-zinc-950">
              {page === 'main' ? 'Settings' : 'Data & Storage'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {page === 'main' ? (
            <>
              {/* 1. Initial Dives (Moving from another logbook) */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Initial Dives (Prior Logbook Count)</span>
                </label>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Moving over from another dive log? Set how many dives you
                    completed before using this app. For example, if you set{' '}
                    <strong className="text-zinc-950">100</strong>, your first
                    dive logged here will be{' '}
                    <strong className="text-zinc-950">Dive #101</strong>.
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        max="99999"
                        value={draftInitialDives}
                        onChange={(e) => setDraftInitialDives(e.target.value)}
                        placeholder="e.g. 100"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 focus:border-zinc-900 text-sm font-bold text-zinc-950 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyInitialDives}
                      className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold shrink-0 transition-colors"
                    >
                      Save
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                    <span>
                      First dive in app:{' '}
                      <strong className="text-zinc-900">
                        #{firstAppDiveNumber}
                      </strong>
                    </span>
                    <span>
                      Total career dives:{' '}
                      <strong className="text-zinc-900">
                        {latestAppDiveNumber}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Data & Storage Entry Button */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Storage & Backup
                </label>
                <button
                  type="button"
                  onClick={() => setPage('data')}
                  className="w-full p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 text-left flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-zinc-950">
                        Data & Storage
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5 truncate">
                        {photoStorageMode === 'app-compressed'
                          ? 'Compressing photos into app data'
                          : 'Linking photos to phone gallery'}{' '}
                        • {totalAppDisplay} used
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>
              </div>

              {/* 3. Measurement System */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Measurement System</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeUnitSystem('metric')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      unitSystem === 'metric'
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">Metric</div>
                      <div
                        className={`text-xs mt-0.5 ${
                          unitSystem === 'metric'
                            ? 'text-zinc-300'
                            : 'text-zinc-500'
                        }`}
                      >
                        Meters (m) • Bar • Celsius (°C) • Liters
                      </div>
                    </div>
                    {unitSystem === 'metric' && <Check className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeUnitSystem('imperial')}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      unitSystem === 'imperial'
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold">Imperial</div>
                      <div
                        className={`text-xs mt-0.5 ${
                          unitSystem === 'imperial'
                            ? 'text-zinc-300'
                            : 'text-zinc-500'
                        }`}
                      >
                        Feet (ft) • PSI • Fahrenheit (°F) • Cubic Feet
                      </div>
                    </div>
                    {unitSystem === 'imperial' && <Check className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* DATA & STORAGE SUBPAGE */
            <>
              {/* 1. App Data Breakdown */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>App Storage Breakdown</span>
                </label>

                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600">
                      Dive Logs, Trips, Buddies & Gear ({dives.length} dives,{' '}
                      {trips.length} trips)
                    </span>
                    <span className="text-xs font-bold text-zinc-950">
                      {logDataKB} KB
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600">
                      Compressed Dive Photos in App ({appStoredPhotos.length}{' '}
                      photos)
                    </span>
                    <span className="text-xs font-bold text-zinc-950">
                      {photoStorageKB} KB
                    </span>
                  </div>

                  {phoneLinkedPhotos.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500">
                        Phone-Linked Photos ({phoneLinkedPhotos.length} photos)
                      </span>
                      <span className="text-xs font-semibold text-zinc-500">
                        0 KB in app
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-950">
                      Total App Footprint
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-zinc-950 text-white text-xs font-bold">
                      {totalAppDisplay}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Photos & Media Storage Mode Toggle */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Photos & Media Storage</span>
                </label>

                <div className="space-y-2">
                  {/* Option A: Compress Photos into App Data */}
                  <button
                    type="button"
                    onClick={() => onChangePhotoStorageMode('app-compressed')}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      photoStorageMode === 'app-compressed'
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">
                        Compress Photos into App Data
                      </span>
                      {photoStorageMode === 'app-compressed' && (
                        <Check className="w-4 h-4 shrink-0" />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        photoStorageMode === 'app-compressed'
                          ? 'text-zinc-300'
                          : 'text-zinc-500'
                      }`}
                    >
                      Saves a lightweight (~35 KB WebP) copy inside the app. You
                      can safely delete the original high-res photos from your
                      phone gallery and your dive log photos will stay stored in
                      the app.
                    </p>
                  </button>

                  {/* Option B: Reference Phone Gallery Only */}
                  <button
                    type="button"
                    onClick={() => onChangePhotoStorageMode('phone-link')}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      photoStorageMode === 'phone-link'
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold">
                        Reference Phone Gallery Only
                      </span>
                      {photoStorageMode === 'phone-link' && (
                        <Check className="w-4 h-4 shrink-0" />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        photoStorageMode === 'phone-link'
                          ? 'text-zinc-300'
                          : 'text-zinc-500'
                      }`}
                    >
                      Does not store copies inside the app. If you delete or
                      move the photo from your phone gallery, it will be removed
                      from that dive in the app.
                    </p>
                  </button>
                </div>

                {photoStorageMode === 'phone-link' && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-300 flex items-start gap-2.5 text-xs text-red-900 font-medium">
                    <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                    <span>
                      New photos added while this option is selected are linked
                      to your phone gallery. Deleting them from your phone will
                      remove them from your dive log.
                    </span>
                  </div>
                )}

                {phoneLinkedPhotos.length > 0 &&
                  photoStorageMode === 'app-compressed' && (
                    <button
                      type="button"
                      onClick={onConvertLinkedPhotosToApp}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs font-bold text-zinc-900 flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        Compress {phoneLinkedPhotos.length} Phone-Linked{' '}
                        {phoneLinkedPhotos.length === 1 ? 'Photo' : 'Photos'}{' '}
                        into App Data
                      </span>
                    </button>
                  )}
              </div>

              {/* 3. Backup & Restore All Dive Data */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Logbook Backup & Restore
                </label>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Export all your dive logs, trips, buddies, gear, and saved
                  photos into a single backup file to keep safe or transfer to a
                  new phone.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Backup</span>
                  </button>

                  <div>
                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => importInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-900 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Restore Backup</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Done Button */}
        <div className="p-4 border-t border-zinc-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-zinc-900 text-white text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
