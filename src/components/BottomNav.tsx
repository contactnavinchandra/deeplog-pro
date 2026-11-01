import React from 'react';
import { BookOpen, PlusSquare, Wrench, Fish, BarChart3 } from 'lucide-react';
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
  }[] = [
    {
      id: 'dives',
      label: 'My Dives',
      icon: BookOpen,
      badge: `${diveCount}`,
    },
    {
      id: 'log',
      label: 'Log Dive',
      icon: PlusSquare,
    },
    {
      id: 'gear',
      label: 'Gear & Crew',
      icon: Wrench,
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
      className="sticky bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-lg border-t border-zinc-200 px-1.5 py-1.5 shrink-0"
    >
      <div className="grid grid-cols-5 gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all ${
                isActive
                  ? 'text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.4] text-zinc-950' : 'stroke-[1.7]'}`} />
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3.5 px-1 rounded-full text-[8px] font-mono font-bold leading-tight ${
                      isActive
                        ? 'bg-zinc-900 text-white'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-zinc-950" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
