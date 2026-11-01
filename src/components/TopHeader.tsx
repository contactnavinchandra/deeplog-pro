import React from 'react';
import { Settings, Waves } from 'lucide-react';
import { TabId } from '../types/dive';

interface TopHeaderProps {
  activeTab: TabId;
  latestDiveNumber: number;
  onOpenSettings: () => void;
}

const TAB_TITLES: Record<TabId, string> = {
  dives: 'Logbook',
  log: 'Log a Dive',
  gear: 'Gear & Buddies',
  critters: 'Critter Dex',
  stats: 'Statistics',
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  latestDiveNumber,
  onOpenSettings,
}) => {
  return (
    <header
      className="z-30 bg-white border-b border-zinc-200 px-4 pt-2.5 pb-2.5 shrink-0 flex items-center justify-between"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 10px)' }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
          <Waves className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-zinc-950 truncate">
              {TAB_TITLES[activeTab]}
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600">
              {latestDiveNumber} Dives
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center transition-colors shrink-0"
        aria-label="Open Settings"
        title="Settings & Units"
      >
        <Settings className="w-4 h-4" />
      </button>
    </header>
  );
};
