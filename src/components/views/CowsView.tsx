import { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Droplets, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  Archive
} from 'lucide-react';
import type { Cow, CowStatus, MilkRecord, HealthRecord } from '../../types/farm';
import { Badge } from '../common/Badge';
import { CowProfileModal } from '../modals/CowProfileModal';
import { ArchiveConfirmModal } from '../modals/ArchiveConfirmModal';

interface CowsViewProps {
  cows: Cow[];
  milkRecords?: MilkRecord[];
  healthRecords?: HealthRecord[];
  onOpenAddCow: () => void;
  onOpenEditCow: (cow: Cow) => void;
  onOpenAddMilk: (cow?: Cow) => void;
  onOpenAddHealth: (cow?: Cow) => void;
  onDeleteOrArchiveCow: (cow: Cow) => Promise<{ success: boolean; error?: string; isArchived?: boolean } | void> | void;
}

type CowFilterTab = 'all' | CowStatus | 'archived';

export const CowsView = ({
  cows,
  milkRecords = [],
  healthRecords = [],
  onOpenAddCow,
  onOpenEditCow,
  onOpenAddMilk,
  onOpenAddHealth,
  onDeleteOrArchiveCow,
}: CowsViewProps) => {
  const [filter, setFilter] = useState<CowFilterTab>('all');
  const [search, setSearch] = useState('');
  const [profileCow, setProfileCow] = useState<Cow | null>(null);
  const [confirmArchiveCow, setConfirmArchiveCow] = useState<Cow | null>(null);

  // Filter & Search logic
  const filteredCows = cows.filter((cow) => {
    let matchesFilter = true;
    if (filter === 'archived') {
      matchesFilter = Boolean(cow.isArchived);
    } else if (filter === 'all') {
      // By default show active cows unless explicitly on archived tab
      matchesFilter = !cow.isArchived;
    } else {
      matchesFilter = cow.status === filter && !cow.isArchived;
    }

    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      cow.name.toLowerCase().includes(query) ||
      cow.tagNumber.toLowerCase().includes(query) ||
      cow.breed.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const activeCows = cows.filter((c) => !c.isArchived);
  const milkingCount = activeCows.filter((c) => c.status === 'milking').length;
  const pregnantCount = activeCows.filter((c) => c.status === 'pregnant').length;
  const dryCount = activeCows.filter((c) => c.status === 'dry').length;
  const calvesCount = activeCows.filter((c) => c.status === 'calf').length;
  const soldCount = activeCows.filter((c) => c.status === 'sold').length;
  const archivedCount = cows.filter((c) => c.isArchived).length;

  // Counts for the confirm modal
  const targetCowMilkRecords = confirmArchiveCow
    ? milkRecords.filter((r) => r.cowId === confirmArchiveCow.id).length
    : 0;
  const targetCowHealthRecords = confirmArchiveCow
    ? healthRecords.filter((h) => h.cowId === confirmArchiveCow.id).length
    : 0;
  const hasHistoricalRecords = targetCowMilkRecords > 0 || targetCowHealthRecords > 0;

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#16402C]/10 text-[#16402C]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">গরুর তালিকা ও প্রোফাইল</h2>
              <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                খামারের প্রতিটি গরুর স্বাস্থ্য, জাত, জীবনবৃত্তান্ত ও দুধের উৎপাদন রেকর্ড
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAddCow}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-[#E5B842]" />
          <span>নতুন গরু যোগ করুন</span>
        </button>
      </div>

      {/* Summary Filter Pills & Search */}
      <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-[#16402C] text-white'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              সক্রিয় গরু ({activeCows.length})
            </button>
            <button
              onClick={() => setFilter('milking')}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                filter === 'milking'
                  ? 'bg-[#16402C] text-white'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              দুধাল ({milkingCount})
            </button>
            <button
              onClick={() => setFilter('pregnant')}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                filter === 'pregnant'
                  ? 'bg-[#16402C] text-white'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              গাভীন ({pregnantCount})
            </button>
            <button
              onClick={() => setFilter('dry')}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                filter === 'dry'
                  ? 'bg-[#16402C] text-white'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              শুকনো ({dryCount})
            </button>
            <button
              onClick={() => setFilter('calf')}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                filter === 'calf'
                  ? 'bg-[#16402C] text-white'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
              }`}
            >
              বাছুর ({calvesCount})
            </button>
            {soldCount > 0 && (
              <button
                onClick={() => setFilter('sold')}
                className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                  filter === 'sold'
                    ? 'bg-[#16402C] text-white'
                    : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1]'
                }`}
              >
                বিক্রি হয়েছে ({soldCount})
              </button>
            )}
            {archivedCount > 0 && (
              <button
                onClick={() => setFilter('archived')}
                className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors ${
                  filter === 'archived'
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                আর্কাইভ ({archivedCount})
              </button>
            )}
          </div>

          {/* Search input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম, ট্যাগ বা জাত দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-xs md:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Cows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCows.map((cow) => {
          const isMilking = cow.status === 'milking';
          const isPregnant = cow.status === 'pregnant';
          const isCalf = cow.status === 'calf';
          const isDryCow = cow.status === 'dry';
          const isSoldCow = cow.status === 'sold';
          const isArchived = Boolean(cow.isArchived);

          return (
            <div
              key={cow.id}
              onClick={() => setProfileCow(cow)}
              className={`bg-white rounded-2xl border p-4 md:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:shadow-md ${
                isArchived
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-[#EAE2D0] hover:border-[#16402C]/40'
              }`}
            >
              <div>
                {/* Top Card Row */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#F4EFE2]">
                  <div>
                    <span className="text-xs font-bold text-[#16402C] bg-[#FAF7F0] px-2.5 py-1 rounded-lg border border-[#E8DFC9] inline-block mb-1">
                      {cow.tagNumber}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#16402C] transition-colors">
                      {cow.name}
                    </h3>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {isMilking && <Badge variant="success">দুধাল</Badge>}
                    {isPregnant && <Badge variant="gold">গাভীন</Badge>}
                    {isCalf && <Badge variant="info">বাছুর</Badge>}
                    {isDryCow && <Badge variant="neutral">শুকনো</Badge>}
                    {isSoldCow && <Badge variant="neutral">বিক্রিত</Badge>}
                    {isArchived && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                        আর্কাইভ
                      </span>
                    )}
                  </div>
                </div>

                {/* Breed & Age */}
                <div className="py-3 space-y-1.5 text-xs text-gray-600">
                  <p className="flex items-center justify-between">
                    <span>জাত:</span>
                    <strong className="text-gray-900 font-semibold">{cow.breed}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>বয়স:</span>
                    <strong className="text-gray-900 font-semibold">
                      {cow.ageYears} বছর{' '}
                      <span className="text-[11px] text-gray-400 font-normal">
                        ({cow.isAgeEstimated !== false ? 'আনুমানিক' : 'যাচাইকৃত'})
                      </span>
                    </strong>
                  </p>
                  {isMilking && (
                    <p className="flex items-center justify-between text-[#16402C]">
                      <span className="font-medium">দৈনিক গড় দুধ:</span>
                      <strong className="font-bold text-sm text-[#16402C]">
                        {cow.dailyAvgMilkLiters} লিটার
                      </strong>
                    </p>
                  )}
                  {isPregnant && cow.expectedCalvingDate && (
                    <p className="flex items-center justify-between text-[#936709]">
                      <span className="font-medium">সম্ভাব্য প্রসব:</span>
                      <strong className="font-bold">{cow.expectedCalvingDate}</strong>
                    </p>
                  )}
                  {cow.purchasePrice && cow.purchasePrice > 0 && (
                    <p className="flex items-center justify-between text-gray-500">
                      <span>ক্রয়মূল্য:</span>
                      <strong className="font-semibold text-gray-800">
                        ৳ {cow.purchasePrice.toLocaleString('en-US')}
                      </strong>
                    </p>
                  )}
                </div>

                {/* Vaccine pill */}
                {cow.lastVaccinatedDate && (
                  <div className="pt-2 border-t border-[#F4EFE2] flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2A7A50]" /> টিকা: {cow.lastVaccinatedDate}
                    </span>
                    <span className="text-[10px] text-gray-400">প্রোফাইল দেখুন</span>
                  </div>
                )}
              </div>

              {/* Action row at bottom of card */}
              <div className="mt-4 pt-3 border-t border-[#F4EFE2] flex items-center gap-2">
                {isMilking && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddMilk(cow);
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#16402C] hover:text-white text-[#16402C] font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <Droplets className="w-3.5 h-3.5 text-[#2A7A50]" />
                    <span>দুধের হিসাব</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddHealth(cow);
                  }}
                  className="py-2 px-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-gray-200"
                  title="টিকা ও চিকিৎসা"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#936709]" />
                  <span>চিকিৎসা</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditCow(cow);
                  }}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 transition-colors"
                  title="সম্পাদনা"
                  aria-label="সম্পাদনা"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmArchiveCow(cow);
                  }}
                  className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 border border-red-200 transition-colors"
                  title="মুছুন বা আর্কাইভ"
                  aria-label="মুছুন বা আর্কাইভ"
                >
                  {isArchived ? <Archive className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCows.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE2D0] shadow-xs space-y-3">
          <div className="w-14 h-14 bg-[#EAF5EE] text-[#16402C] rounded-2xl mx-auto flex items-center justify-center">
            <Plus className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold text-[#16402C]">খামারে কোনো গরু পাওয়া যায়নি</h4>
          <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto">
            {search || filter !== 'all'
              ? 'আপনার ফিল্টার বা অনুসন্ধানের সাথে মেলে এমন কোনো গরু পাওয়া যায়নি।'
              : 'আপনার খামারের গাভী, বাছুর বা ষাঁড়ের তথ্য যুক্ত করে সহজে দুধ ও স্বাস্থ্যের নিয়মিত হিসাব রাখুন।'}
          </p>
          <button
            onClick={() => onOpenAddCow()}
            className="px-5 py-2.5 rounded-2xl bg-[#16402C] hover:bg-[#1f563b] text-white font-bold text-xs md:text-sm inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E5B842]" />
            <span>নতুন গরু যোগ করুন</span>
          </button>
        </div>
      )}

      {/* Rich Individual Cow Profile Modal */}
      <CowProfileModal
        isOpen={Boolean(profileCow)}
        onClose={() => setProfileCow(null)}
        cow={profileCow}
        milkRecords={milkRecords}
        healthRecords={healthRecords}
        onOpenEditCow={(c) => {
          setProfileCow(null);
          onOpenEditCow(c);
        }}
        onRequestDeleteOrArchive={(c) => {
          setProfileCow(null);
          setConfirmArchiveCow(c);
        }}
        onOpenAddMilkForCow={(c) => onOpenAddMilk(c)}
        onOpenAddHealthForCow={(c) => onOpenAddHealth(c)}
      />

      {/* Safe Archive or Delete Confirmation Modal */}
      <ArchiveConfirmModal
        isOpen={Boolean(confirmArchiveCow)}
        onClose={() => setConfirmArchiveCow(null)}
        cow={confirmArchiveCow}
        hasHistoricalRecords={hasHistoricalRecords}
        milkRecordCount={targetCowMilkRecords}
        healthRecordCount={targetCowHealthRecords}
        onConfirm={async () => {
          if (confirmArchiveCow) {
            await onDeleteOrArchiveCow(confirmArchiveCow);
          }
        }}
      />
    </div>
  );
};

