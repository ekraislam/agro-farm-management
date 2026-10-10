import { formatCurrency } from '../../utils/accounting';
import { useState } from 'react';
import { 
  X, 
  Droplets, 
  ShieldCheck, 
  FileText, 
  Edit3, 
  Trash2, 
  Calendar, 
  Plus, 
  Activity, 
  Tag
} from 'lucide-react';
import type { Cow, MilkRecord, HealthRecord } from '../../types/farm';
import { Badge } from '../common/Badge';
import { getCowMilkHistory, calculateCowMilkStats } from '../../utils/milkAccounting';

interface CowProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  cow: Cow | null;
  milkRecords: MilkRecord[];
  healthRecords: HealthRecord[];
  onOpenEditCow: (cow: Cow) => void;
  onRequestDeleteOrArchive: (cow: Cow) => void;
  onOpenAddMilkForCow: (cow: Cow) => void;
  onOpenAddHealthForCow: (cow: Cow) => void;
}

export const CowProfileModal = ({
  isOpen,
  onClose,
  cow,
  milkRecords,
  healthRecords,
  onOpenEditCow,
  onRequestDeleteOrArchive,
  onOpenAddMilkForCow,
  onOpenAddHealthForCow,
}: CowProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'milk' | 'health'>('overview');

  if (!isOpen || !cow) return null;

  // Filter records for this cow
  const cowMilkHistory = getCowMilkHistory(milkRecords, cow.id);
  const cowMilkStats = calculateCowMilkStats(milkRecords, cow.id);
  const cowHealthHistory = healthRecords
    .filter((h) => h.cowId === cow.id)
    .sort((a, b) => (b.eventDate > a.eventDate ? 1 : -1));

  const isMilking = cow.status === 'milking';
  const isPregnant = cow.status === 'pregnant';
  const isCalf = cow.status === 'calf';
  const isSold = cow.status === 'sold';
  const isDry = cow.status === 'dry';
  const isSick = cow.status === 'sick';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFC9] flex flex-col">
        {/* Header */}
        <div className="p-5 md:p-6 bg-[#16402C] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-3xl">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-white/10 text-[#E5B842] shrink-0">
              <Tag className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#16402C] bg-[#FAF7F0] px-2.5 py-0.5 rounded-lg border border-[#E8DFC9]">
                  {cow.tagNumber}
                </span>
                {cow.isArchived && (
                  <span className="text-[11px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md">
                    পুরোনো তালিকায় রাখা
                  </span>
                )}
                {isMilking && <Badge variant="success">দুধাল গাভী</Badge>}
                {isPregnant && <Badge variant="gold">গাভীন</Badge>}
                {isCalf && <Badge variant="info">বাছুর</Badge>}
                {isDry && <Badge variant="neutral">দুধ বন্ধ</Badge>}
                {isSick && <Badge variant="danger">অসুস্থ</Badge>}
                {isSold && <Badge variant="neutral">বিক্রি হয়েছে</Badge>}
              </div>

              <h2 className="text-xl md:text-2xl font-black mt-1 text-white tracking-tight">
                {cow.name}
              </h2>
              <p className="text-xs text-white/80">{cow.breed}</p>
            </div>
          </div>

          {/* Action buttons (Close, Edit, Delete) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => onOpenEditCow(cow)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#E5B842]" />
              <span>তথ্য পরিবর্তন</span>
            </button>
            <button
              onClick={() => onRequestDeleteOrArchive(cow)}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>মুছুন / পুরোনো তালিকায় রাখুন</span>
            </button>
            <button
              onClick={onClose}
              aria-label="বন্ধ করুন"
              className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-[#EAE2D0] bg-[#FAF7F0] px-4 md:px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#16402C] text-[#16402C]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>পরিচিতি ও বিবরণ</span>
          </button>

          <button
            onClick={() => setActiveTab('milk')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'milk'
                ? 'border-[#16402C] text-[#16402C]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Droplets className="w-4 h-4 text-[#2A7A50]" />
            <span>দুধের খাতা ({cowMilkHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'health'
                ? 'border-[#16402C] text-[#16402C]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#936709]" />
            <span>টিকা ও চিকিৎসা ({cowHealthHistory.length})</span>
          </button>
        </div>

        {/* Modal Tab Content */}
        <div className="p-5 md:p-6 space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0]">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1">লিঙ্গ ও জাত</span>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-gray-700">জাত: <strong>{cow.breed}</strong></span>
                    <span className="font-bold text-[#16402C]">
                      {cow.gender === 'male' ? 'ষাঁড় / বাছুর' : 'গাভী / বকনা'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0]">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1">বয়সের হিসাব</span>
                  <div className="text-xs md:text-sm">
                    {cow.isAgeEstimated !== false ? (
                      <p className="font-semibold text-gray-900">
                        {cow.ageYears} বছর <span className="text-gray-500 text-xs font-normal">(আনুমানিক বয়স)</span>
                      </p>
                    ) : (
                      <p className="font-semibold text-gray-900">
                        জন্মতারিখ: {cow.dateOfBirth || 'প্রদত্ত'} <br />
                        <span className="text-[#2A7A50] text-xs font-bold">({cow.ageYears} বছর — সঠিক)</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0]">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1">দুধ দোয়ানোর অবস্থা</span>
                  <p className="text-xs md:text-sm text-gray-900 font-semibold">
                    {isMilking ? (
                      <span>দৈনিক গড় দুধ: <strong className="text-[#16402C]">{cow.dailyAvgMilkLiters} লিটার</strong></span>
                    ) : (
                      <span className="text-gray-500">বর্তমানে দুধ দোহন বন্ধ ({cow.statusLabelBn})</span>
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0]">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1">কেনা ও খরচের তথ্য</span>
                  <div className="text-xs md:text-sm text-gray-900">
                    {cow.purchasePrice ? (
                      <p className="font-semibold text-[#16402C]">
                        মূল্য: ৳ {formatCurrency(cow.purchasePrice)}
                        {cow.purchaseDate && <span className="text-gray-500 text-xs font-normal"> ({cow.purchaseDate})</span>}
                      </p>
                    ) : (
                      <p className="text-gray-400">খামারেই জন্ম অথবা কেনা মূল্যের তথ্য নেই</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Special Pregnancy Notice */}
              {isPregnant && cow.expectedCalvingDate && (
                <div className="p-4 rounded-2xl bg-[#FEF9E7] border border-[#F7E2A9] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#936709]" />
                    <div>
                      <h4 className="text-sm font-bold text-[#936709]">সম্ভাব্য প্রসবের তারিখ</h4>
                      <p className="text-xs text-gray-600">বাছুর প্রসবের সম্ভাব্য সময়</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-[#936709]">{cow.expectedCalvingDate}</span>
                </div>
              )}

              {/* Notes Card */}
              {cow.notes && (
                <div className="p-4 rounded-2xl bg-white border border-[#EAE2D0] space-y-1">
                  <h4 className="text-xs font-bold text-gray-700">নোট বা বিশেষ লক্ষণ:</h4>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{cow.notes}</p>
                </div>
              )}

              {/* Bottom Quick Triggers */}
              <div className="pt-2 flex flex-wrap gap-2.5">
                {isMilking && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAddMilkForCow(cow);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Droplets className="w-4 h-4 text-[#E5B842]" />
                    <span>আজকের দুধের হিসাব লিখুন</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddHealthForCow(cow);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#FAF7F0] hover:bg-[#EAE2D0] text-[#16402C] border border-[#EAE2D0] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#2A7A50]" />
                  <span>টিকা বা চিকিৎসা লিখুন</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MILK RECORDS */}
          {activeTab === 'milk' && (
            <div className="space-y-4">
              {/* Milk Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#EAF5EE] border border-[#C5E3D0] text-center">
                  <span className="text-[10px] font-bold text-[#1B4D35] block">মোট দোয়ানো দুধ</span>
                  <strong className="text-base font-black text-[#16402C]">{cowMilkStats.totalLiters} লিটার</strong>
                </div>
                <div className="p-3 rounded-2xl bg-[#EAF5EE] border border-[#C5E3D0] text-center">
                  <span className="text-[10px] font-bold text-[#1B4D35] block">দৈনিক গড় দুধ</span>
                  <strong className="text-base font-black text-[#16402C]">{cowMilkStats.averageDailyLiters} লিটার</strong>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] text-center">
                  <span className="text-[10px] font-bold text-gray-600 block">মোট দোয়ানোর দিন</span>
                  <strong className="text-base font-black text-gray-900">{cowMilkStats.recordCount} দিন</strong>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] text-center">
                  <span className="text-[10px] font-bold text-gray-600 block">সর্বশেষ দোয়ানো</span>
                  <strong className="text-base font-black text-gray-900">{cowMilkStats.lastRecordLiters} লিটার</strong>
                </div>
              </div>

              {/* Action: Add Milk for this cow */}
              <div className="flex items-center justify-between pt-1">
                <h4 className="text-xs font-bold text-[#16402C]">দুধ দোয়ানোর বিস্তারিত খাতা</h4>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddMilkForCow(cow);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>দুধের হিসাব লিখুন</span>
                </button>
              </div>

              {/* Records List */}
              {cowMilkHistory.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {cowMilkHistory.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-white border border-[#EAE2D0] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{rec.date}</span>
                          {rec.isSold ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0]">
                              বিক্রি (৳{rec.totalAmount})
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800">
                              বাছুরের খাওয়া ও নিজেরা ব্যবহার
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          সকাল: {rec.morningLiters} লি. | বিকাল: {rec.eveningLiters} লি.
                          {rec.recordedBy && ` • ${rec.recordedBy}`}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-[#16402C] block">
                          {rec.totalLiters} লিটার
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0]">
                  <Droplets className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">
                    এই গরুর জন্য আলাদা কোনো দুধের হিসাব এখনো লেখা হয়নি।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HEALTH RECORDS */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#16402C]">টিকা ও চিকিৎসার তালিকা</h4>
                  <p className="text-[11px] text-gray-500">সব চিকিৎসা ও পরবর্তী তারিখের হিসাব</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddHealthForCow(cow);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>চিকিৎসার হিসাব লিখুন</span>
                </button>
              </div>

              {cowHealthHistory.length > 0 ? (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {cowHealthHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-2xl bg-white border border-[#EAE2D0] space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF7F0] text-[#16402C] border border-[#E8DFC9]">
                              {h.eventTypeLabelBn}
                            </span>
                            <span className="font-bold text-gray-900 text-sm">{h.treatmentName}</span>
                          </div>
                          {h.doctorName && (
                            <p className="text-[11px] text-gray-500 mt-1">চিকিৎসক: {h.doctorName}</p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-gray-500 font-medium">{h.eventDate}</span>
                          {h.cost && h.cost > 0 && (
                            <span className="block font-bold text-[#16402C] mt-0.5">
                              ৳ {formatCurrency(h.cost)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Next Due Date or Follow Up */}
                      {h.nextDueDate && (
                        <div className="p-2 rounded-xl bg-[#FEF9E7] border border-[#F7E2A9] flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#936709] flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> পরবর্তী টিকা বা ডাক্তার দেখানোর তারিখ:
                          </span>
                          <strong className="text-[#936709]">{h.nextDueDate}</strong>
                        </div>
                      )}

                      {h.notes && (
                        <p className="text-[11px] text-gray-600 pt-1 border-t border-gray-100">
                          {h.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0]">
                  <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-medium">
                    এই গরুর জন্য এখনো কোনো টিকা বা চিকিৎসার তথ্য লেখা হয়নি।
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
