import React, { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, CheckCircle2, Waves, Download } from 'lucide-react';
import { UnitSystem } from '../types/dive';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface TopHeaderProps {
  unitSystem: UnitSystem;
  onToggleUnit: (unit: UnitSystem) => void;
  phonePhotosDeleted: boolean;
  onTogglePhonePhotosDeleted: () => void;
  totalVaultKB: number;
  totalOriginalMB: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  unitSystem,
  onToggleUnit,
  phonePhotosDeleted,
  onTogglePhonePhotosDeleted,
  totalVaultKB,
  totalOriginalMB,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-3.5 py-2.5">
      {/* Row 1: App Title + Install Button + Metric/Imperial Unit Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center shadow-sm shrink-0">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display text-sm font-bold tracking-tight text-zinc-950 truncate">
                DEEPLOG <span className="font-normal text-zinc-400">PRO</span>
              </h1>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                <ShieldCheck className="w-2.5 h-2.5 text-zinc-900" />
                {Math.round(totalVaultKB)}KB
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium truncate">
              Geko Dive Bali • Dives #215–#222
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Native Android Install Button (appears automatically when eligible) */}
          {deferredPrompt && !isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-950 text-white text-[10px] font-bold shadow-sm animate-pulse"
            >
              <Download className="w-3 h-3" />
              <span>Install App</span>
            </button>
          )}

          {/* Metric / Imperial Segmented Toggle */}
          <div
            className="inline-flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 shrink-0"
            role="group"
            aria-label="Unit system toggle"
          >
            <button
              type="button"
              onClick={() => onToggleUnit('metric')}
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                unitSystem === 'metric'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              M/BAR/°C
            </button>
            <button
              type="button"
              onClick={() => onToggleUnit('imperial')}
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-semibold transition-all ${
                unitSystem === 'imperial'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              FT/PSI/°F
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Compact Mobile Vault Simulation Bar */}
      <div className="mt-2 pt-1.5 border-t border-zinc-100 flex items-center justify-between gap-2">
        <span className="text-[10px] text-zinc-500 truncate">
          Vault: <strong className="text-zinc-900 font-mono">{Math.round(totalVaultKB)} KB WebP</strong> (saved {totalOriginalMB.toFixed(1)} MB)
        </span>

        <button
          type="button"
          onClick={onTogglePhonePhotosDeleted}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all border shrink-0 ${
            phonePhotosDeleted
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
          }`}
        >
          {phonePhotosDeleted ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Phone Wiped • Vault Intact</span>
            </>
          ) : (
            <>
              <Trash2 className="w-3 h-3 text-zinc-500 shrink-0" />
              <span>Test: Delete Photos from Phone</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
