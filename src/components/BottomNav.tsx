import React from 'react';
import { BookOpen, Plus, Wrench, Fish, BarChart3 } from 'lucide-react';
import { TabId } from '../types/dive';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  diveCount: number;
  critterSpeciesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  diveCount,
  critterSpeciesCount,
}) => {
  const navItems: {
    id: TabId;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    isCenterPrimary?: boolean;
  }[] = [
    {
      id: 'dives',
      label: 'My Dives',
      icon: BookOpen,
      badge: `${diveCount}`,
    },
    {
      id: 'gear',
      label: 'Gear & Buddies',
      icon: Wrench,
    },
    {
      id: 'log',
      label: 'Log Dive',
      icon: Plus,
      isCenterPrimary: true,
    },
    {
      id: 'critters',
      label: 'Critter Dex',
      icon: Fish,
      badge: `${critterSpeciesCount}`,
    },
    {
      id: 'stats',
      label: 'Statistics',
      icon: BarChart3,
    },
  ];

  return (
    <nav
      aria-label="Primary bottom navigation"
      className="z-30 bg-white border-t border-zinc-200 px-2 pt-1.5 shrink-0"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <div className="grid grid-cols-5 gap-1 items-stretch">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.isCenterPrimary) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className="relative flex flex-col items-center justify-between py-1 px-1 rounded-xl transition-all group"
              >
                <div className="h-7 flex items-center justify-center">
                  <div
                    className={`w-10 h-7 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                      isActive
                        ? 'bg-zinc-950 text-white ring-2 ring-zinc-900/20'
                        : 'bg-zinc-950 text-white group-hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.6]" />
                  </div>
                </div>
                <span
                  className={`text-[10px] leading-none mt-1.5 tracking-tight truncate max-w-full ${
                    isActive ? 'text-zinc-950 font-bold' : 'text-zinc-800 font-semibold'
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-zinc-950" />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-between py-1 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-zinc-950 font-semibold bg-zinc-100/70'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <div className="relative h-7 flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'stroke-[2.3] text-zinc-950' : 'stroke-[1.8]'
                  }`}
                />
                {item.badge && (
                  <span
                    className={`absolute top-0 -right-3.5 px-1 rounded-full text-[9px] font-semibold leading-tight ${
                      isActive
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9.5px] leading-none mt-1.5 tracking-tight whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-zinc-950" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
