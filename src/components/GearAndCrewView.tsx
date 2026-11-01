import React, { useState } from 'react';
import {
  Plus,
  Wrench,
  Users,
  Trash2,
  Award,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  DiveCertification,
  DiveRecord,
  GearCategory,
} from '../types/dive';

interface GearAndCrewViewProps {
  dives: DiveRecord[];
  certifications: DiveCertification[];
  onAddCertification: (cert: Omit<DiveCertification, 'id'>) => void;
  onRemoveCertification: (id: string) => void;
  gearCategories: GearCategory[];
  onAddGearCategory: (categoryName: string) => void;
  onRemoveGearCategory: (categoryId: string) => void;
  onAddGearItemToCategory: (categoryId: string, itemName: string) => void;
  onRemoveGearItemFromCategory: (categoryId: string, itemName: string) => void;
  buddyPool: string[];
  onAddBuddyToPool: (buddy: string) => void;
  onRemoveBuddyFromPool: (buddy: string) => void;
}

export const GearAndCrewView: React.FC<GearAndCrewViewProps> = ({
  dives,
  certifications,
  onAddCertification,
  onRemoveCertification,
  gearCategories,
  onAddGearCategory,
  onRemoveGearCategory,
  onAddGearItemToCategory,
  onRemoveGearItemFromCategory,
  buddyPool,
  onAddBuddyToPool,
  onRemoveBuddyFromPool,
}) => {
  // Certification Form State
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [certAgency, setCertAgency] = useState('PADI');
  const [certTitle, setCertTitle] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certYear, setCertYear] = useState('2026');

  // Buddy Form State
  const [isAddingBuddy, setIsAddingBuddy] = useState(false);
  const [newBuddyInput, setNewBuddyInput] = useState('');

  // Gear Category State (Start cleanly collapsed so all categories are easy to scan)
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([]);
  const [newItemByCategory, setNewItemByCategory] = useState<Record<string, string>>(
    {}
  );

  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    onAddGearCategory(trimmed);
    setNewCategoryName('');
    setIsCreatingCategory(false);
  };

  const handleAddItemToCat = (categoryId: string, e: React.FormEvent) => {
    e.preventDefault();
    const raw = newItemByCategory[categoryId] || '';
    const trimmed = raw.trim();
    if (!trimmed) return;
    onAddGearItemToCategory(categoryId, trimmed);
    setNewItemByCategory((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const handleAddCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle.trim()) return;
    onAddCertification({
      agency: certAgency.trim() || 'PADI',
      title: certTitle.trim(),
      certNumber: certNumber.trim() || undefined,
      year: certYear.trim() || undefined,
    });
    setCertTitle('');
    setCertNumber('');
    setIsAddingCert(false);
  };

  const handleAddBuddy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuddyInput.trim()) return;
    onAddBuddyToPool(newBuddyInput.trim());
    setNewBuddyInput('');
    setIsAddingBuddy(false);
  };

  return (
    <div className="space-y-3 pb-4">
      {/* 1. DIVE CERTIFICATIONS */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>Certifications ({certifications.length})</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsAddingCert((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingCert ? 'Cancel' : 'Add Certification'}</span>
          </button>
        </div>

        {isAddingCert && (
          <form
            onSubmit={handleAddCertSubmit}
            className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2.5"
          >
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Agency
                </label>
                <select
                  value={certAgency}
                  onChange={(e) => setCertAgency(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-900 outline-none"
                >
                  <option value="PADI">PADI</option>
                  <option value="SSI">SSI</option>
                  <option value="SDI / TDI">SDI / TDI</option>
                  <option value="NAUI">NAUI</option>
                  <option value="RAID">RAID</option>
                  <option value="CMAS">CMAS</option>
                  <option value="BSAC">BSAC</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Certification Level
                </label>
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="e.g. Rescue Diver, Nitrox..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-950 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Cert Number (Optional)
                </label>
                <input
                  type="text"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                  placeholder="e.g. 24089112"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Year (Optional)
                </label>
                <input
                  type="text"
                  value={certYear}
                  onChange={(e) => setCertYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold"
            >
              Save Certification
            </button>
          </form>
        )}

        <div className="divide-y divide-zinc-100">
          {certifications.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-400">
              No certifications added yet.
            </div>
          ) : (
            certifications.map((cert) => (
              <div
                key={cert.id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-950 text-white text-[10px] font-bold shrink-0">
                      {cert.agency}
                    </span>
                    <span className="text-xs font-bold text-zinc-950 truncate">
                      {cert.title}
                    </span>
                  </div>
                  {(cert.certNumber || cert.year) && (
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {cert.certNumber && <span>ID: {cert.certNumber}</span>}
                      {cert.certNumber && cert.year && <span> • </span>}
                      {cert.year && <span>Certified {cert.year}</span>}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveCertification(cert.id)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 shrink-0"
                  title={`Remove ${cert.title}`}
                  aria-label={`Remove ${cert.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. DIVE BUDDIES */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Dive Buddies ({buddyPool.length})</span>
          </h3>
          <button
            type="button"
            onClick={() => setIsAddingBuddy((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingBuddy ? 'Cancel' : 'Add Buddy'}</span>
          </button>
        </div>

        {isAddingBuddy && (
          <form
            onSubmit={handleAddBuddy}
            className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex gap-1.5"
          >
            <input
              type="text"
              value={newBuddyInput}
              onChange={(e) => setNewBuddyInput(e.target.value)}
              placeholder="Enter buddy name..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 focus:border-zinc-900 text-xs font-semibold text-zinc-950 outline-none"
              required
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-bold shrink-0"
            >
              Save
            </button>
          </form>
        )}

        <div className="divide-y divide-zinc-100">
          {buddyPool.map((b) => {
            const buddyDiveCount = dives.filter((d) =>
              d.buddies.includes(b)
            ).length;
            return (
              <div
                key={b}
                className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-900 truncate">
                    {b}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {buddyDiveCount} {buddyDiveCount === 1 ? 'dive' : 'dives'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveBuddyFromPool(b)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 shrink-0"
                  title={`Delete ${b}`}
                  aria-label={`Delete ${b}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. GEAR LOCKER */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            <span>Gear Locker ({gearCategories.length})</span>
          </h3>

          <button
            type="button"
            onClick={() => setIsCreatingCategory((prev) => !prev)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isCreatingCategory ? 'Cancel' : 'Add Category'}</span>
          </button>
        </div>

        {/* Create New Category Form */}
        {isCreatingCategory && (
          <form
            onSubmit={handleCreateCategorySubmit}
            className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex gap-1.5"
          >
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name (e.g. Photography Gear, Wetsuits)..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 focus:border-zinc-900 text-xs font-semibold text-zinc-950 outline-none"
              required
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-bold shrink-0"
            >
              Save
            </button>
          </form>
        )}

        {/* Categories List */}
        <div className="divide-y divide-zinc-100">
          {gearCategories.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-400">
              No gear categories yet.
            </div>
          ) : (
            gearCategories.map((category) => {
              const isExpanded = expandedCategoryIds.includes(category.id);
              const draftItemValue = newItemByCategory[category.id] || '';

              return (
                <div key={category.id} className="py-2 first:pt-0 last:pb-0">
                  {/* Category Row */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(category.id)}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left py-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-900 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-zinc-950 truncate">
                        {category.name}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                        {category.items.length}{' '}
                        {category.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveGearCategory(category.id)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
                        title={`Delete ${category.name}`}
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items Inside Category */}
                  {isExpanded && (
                    <div className="mt-2 ml-5 pl-3 border-l-2 border-zinc-200 space-y-2">
                      {category.items.length === 0 ? (
                        <div className="text-[11px] text-zinc-400 py-1">
                          No items in {category.name} yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-100">
                          {category.items.map((item) => {
                            const diveUseCount = dives.filter((d) =>
                              d.gearUsed.includes(item)
                            ).length;
                            return (
                              <div
                                key={item}
                                className="py-1.5 first:pt-0 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-zinc-900 truncate">
                                    {item}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">
                                    {diveUseCount}{' '}
                                    {diveUseCount === 1 ? 'dive' : 'dives'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRemoveGearItemFromCategory(category.id, item)
                                  }
                                  className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 shrink-0"
                                  title={`Remove ${item}`}
                                  aria-label={`Remove ${item}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add Item Input */}
                      <form
                        onSubmit={(e) => handleAddItemToCat(category.id, e)}
                        className="flex gap-1.5 pt-1"
                      >
                        <input
                          type="text"
                          value={draftItemValue}
                          onChange={(e) =>
                            setNewItemByCategory((prev) => ({
                              ...prev,
                              [category.id]: e.target.value,
                            }))
                          }
                          placeholder={`+ Add item to ${category.name}...`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 focus:border-zinc-900 focus:bg-white text-xs text-zinc-900 outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-semibold shrink-0"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
