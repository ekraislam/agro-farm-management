import { useState } from 'react';
import { 
  Flame, 
  Droplet, 
  Gauge, 
  Clock, 
  Sprout, 
  CheckCircle2, 
  Plus, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle, 
  AlertOctagon, 
  TrendingUp,
  Edit2,
  Trash2
} from 'lucide-react';
import type { BiogasDailyLog, BiogasInspectionItem, Employee } from '../../types/farm';
import { 
  calculateBiogasTotals, 
  filterBiogasLogs, 
  BIOGAS_CHECKLIST_TEMPLATES, 
  BIOGAS_SAFETY_GUIDANCE,
  type BiogasFilterPeriod 
} from '../../utils/biogasAccounting';
import { AddBiogasLogModal } from '../modals/AddBiogasLogModal';
import { BiogasInspectionModal } from '../modals/BiogasInspectionModal';

interface BiogasViewProps {
  logs: BiogasDailyLog[];
  inspections?: BiogasInspectionItem[];
  employees?: Employee[];
  onAddLog: (log: BiogasDailyLog) => Promise<void | { success: boolean; error?: string }>;
  onUpdateLog?: (log: BiogasDailyLog) => Promise<void | { success: boolean; error?: string }>;
  onDeleteLog?: (logId: string) => Promise<void | { success: boolean; error?: string }>;
  onAddInspection?: (item: BiogasInspectionItem) => Promise<{ success: boolean; error?: string }>;
}

export const BiogasView = ({ 
  logs, 
  inspections = [], 
  employees = [],
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  onAddInspection 
}: BiogasViewProps) => {
  const [filterPeriod, setFilterPeriod] = useState<BiogasFilterPeriod>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingLog, setEditingLog] = useState<BiogasDailyLog | null>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Filter logs by selected timeframe
  const filteredLogs = filterBiogasLogs(logs, filterPeriod);
  const totals = calculateBiogasTotals(filteredLogs);

  const handleEditClick = (log: BiogasDailyLog) => {
    setEditingLog(log);
    setShowLogModal(true);
  };

  const handleOpenAdd = () => {
    setEditingLog(null);
    setShowLogModal(true);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E5B842]/20 text-[#8C6200]">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">বায়োগ্যাস প্ল্যান্ট ও জৈব সার</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              গোবর ও পানি দেওয়া, রান্নার গ্যাস, জৈব সার ও নিরাপত্তা পরীক্ষা
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInspectionModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-bold text-xs md:text-sm border border-[#EAE2D0] shadow-xs flex items-center gap-2 active:scale-95 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-[#2A7A50]" />
            <span>নিরাপত্তা পরীক্ষা</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs md:text-sm shadow-xs flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 text-[#E5B842]" />
            <span>গোবর দেওয়ার হিসাব লিখুন</span>
          </button>
        </div>
      </div>

      {/* Timeframe Filter Tabs */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#EAE2D0] shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Calendar className="w-4 h-4 text-[#16402C]" />
          <span>সময়কাল নির্বাচন:</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {[
            { id: 'today', label: 'আজকের' },
            { id: 'week', label: 'বিগত ৭ দিন' },
            { id: 'month', label: 'চলতি মাস (অক্টোবর)' },
            { id: 'all', label: `সকল রেকর্ড (${logs.length}টি)` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPeriod(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                filterPeriod === tab.id
                  ? 'bg-[#16402C] text-white shadow-2xs'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1] border border-[#EAE2D0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Cards (Totals & Actual Daily Averages) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">মোট গোবর দেওয়া হয়েছে</p>
            <p className="text-2xl font-bold text-[#16402C] mt-1">
              {totals.totalDungKg} <span className="text-sm font-normal">কেজি</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              দৈনিক গড়: <strong>{totals.avgDailyDungKg} কেজি</strong> ({totals.recordDaysCount} দিনের হিসাব)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2DAC7] text-[#936709] shrink-0">
            <Droplet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">গ্যাস পাওয়া গেছে / চুলা চলেছে</p>
            <p className="text-2xl font-bold text-[#16402C] mt-1">
              {totals.totalBurnHours} <span className="text-sm font-normal">ঘণ্টা</span>
            </p>
            <p className="text-[11px] text-[#2A7A50] mt-0.5 font-medium">
              দৈনিক গড়: <strong>{totals.avgDailyBurnHours} ঘণ্টা</strong>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2DAC7] text-[#936709] shrink-0">
            <Clock className="w-6 h-6 text-[#936709]" />
          </div>
        </div>

        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">মোট পানি মেশানো হয়েছে</p>
            <p className="text-2xl font-bold text-[#16402C] mt-1">
              {totals.totalWaterLiters} <span className="text-sm font-normal">লিটার</span>
            </p>
            <p className="text-[11px] text-[#2A7A50] mt-0.5 font-medium">
              ১:১ অনুপাত (গড় {totals.avgDailyWaterLiters} লিটার)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2DAC7] text-[#2A7A50] shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">উৎপাদিত জৈব সার (গোবরের সার)</p>
            <p className="text-2xl font-bold text-[#16402C] mt-1">
              {totals.totalSlurryBags} <span className="text-sm font-normal">বস্তা</span>
            </p>
            <p className="text-[11px] text-[#2A7A50] mt-0.5 font-medium">
              ফসলি জমির জন্য উৎকৃষ্ট জৈব সার
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2DAC7] text-[#2A7A50] shrink-0">
            <Sprout className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Production Trend & Efficiency Overview */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#16402C]" />
            <h3 className="font-bold text-base md:text-lg text-[#16402C]">
              বায়োগ্যাসে গোবর দেওয়ার ও চুলা জ্বলার ইতিহাস
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">বিগত রেকর্ডসমূহ</span>
        </div>

        {/* Simple Bar Trend Comparison */}
        <div className="space-y-3 pt-2">
          {filteredLogs.slice(0, 5).map((log) => {
            const dungPercent = Math.min(100, Math.round(((log.dungInputKg || 0) / 150) * 100));
            const burnPercent = Math.min(100, Math.round(((log.burnHoursToday || 0) / 10) * 100));

            return (
              <div key={log.id} className="p-3 bg-[#FAF7F0]/60 rounded-2xl border border-[#EAE2D0] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900">{log.date}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[#8C6200] font-bold">গোবর: {log.dungInputKg} কেজি</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-[#2A7A50] font-bold">চুলা: {log.burnHoursToday} ঘণ্টা</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 font-semibold">সার: {log.slurryProducedBags} বস্তা</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-[#E5B842] rounded-full" style={{ width: `${dungPercent}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full bg-[#2A7A50] rounded-full" style={{ width: `${burnPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety & Maintenance Checklist Section */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2ECE1] gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2A7A50]" />
            <h3 className="font-bold text-base md:text-lg text-[#16402C]">
              বায়োগ্যাস চুলার নিরাপত্তা ও নিয়মিত যত্ন নেওয়ার তালিকা
            </h3>
          </div>

          <button
            onClick={() => setShowInspectionModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-bold text-xs flex items-center gap-1.5 border border-[#EAE2D0] self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নিরাপত্তা পরীক্ষা যোগ করুন</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {BIOGAS_CHECKLIST_TEMPLATES.map((tmpl) => {
            // Find last inspection for this template item
            const lastInsp = inspections.find((i) => i.itemKey === tmpl.itemKey);
            const isGood = !lastInsp || lastInsp.status === 'good';
            const isAttention = lastInsp?.status === 'needs_attention';

            return (
              <div
                key={tmpl.itemKey}
                className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] flex flex-col justify-between space-y-2 hover:border-[#16402C]/30 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isGood ? (
                        <CheckCircle2 className="w-4 h-4 text-[#2A7A50] shrink-0" />
                      ) : isAttention ? (
                        <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                      ) : (
                        <AlertOctagon className="w-4 h-4 text-[#DC2626] shrink-0" />
                      )}
                      <h4 className="font-bold text-xs md:text-sm text-gray-900">{tmpl.itemNameBn}</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#EAE2D0] text-gray-600 font-semibold">
                      {tmpl.recommendedFrequencyBn}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1.5 leading-relaxed">{tmpl.descriptionBn}</p>
                </div>

                <div className="pt-2 border-t border-[#EAE2D0]/60 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">
                    {lastInsp ? `সর্বশেষ: ${lastInsp.date}` : 'নিয়মিত পরীক্ষা চলছে'}
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      isGood
                        ? 'bg-[#EAF5EE] text-[#1B4D35]'
                        : isAttention
                        ? 'bg-[#FFFBEB] text-[#92400E]'
                        : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}
                  >
                    {lastInsp ? lastInsp.statusBn : 'স্বাভাবিক ও নিরাপদ'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Conservative Safety Guidance Alert */}
        <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">জরুরি গ্যাস নিরাপত্তা বার্তা ও নিয়মানুবর্তিতা:</p>
            <p>{BIOGAS_SAFETY_GUIDANCE.emergencyRule}</p>
            <p className="text-[11px] text-amber-800 italic pt-0.5">{BIOGAS_SAFETY_GUIDANCE.noSelfRepair}</p>
          </div>
        </div>
      </div>

      {/* Daily Logs Table / Card List */}
      <div className="bg-white rounded-3xl border border-[#EAE2D0] shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-[#F2ECE1] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base md:text-lg text-[#16402C]">
              বায়োগ্যাসে প্রতিদিনের হিসাবের তালিকা
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">গোবর ও পানি দেওয়া এবং চুলা জ্বলার দৈনিক খাতা</p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#E5B842]" />
            <span>নতুন হিসাব লিখুন</span>
          </button>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#FAF7F0] border-b border-[#EAE2D0] text-gray-700 text-xs uppercase font-bold">
                <tr>
                  <th className="py-3.5 px-4">তারিখ</th>
                  <th className="py-3.5 px-4">গোবর দেওয়া</th>
                  <th className="py-3.5 px-4">পানি মেশানো</th>
                  <th className="py-3.5 px-4">চুলা চলেছে</th>
                  <th className="py-3.5 px-4">জৈব সার</th>
                  <th className="py-3.5 px-4">দায়িত্বে ছিলেন</th>
                  <th className="py-3.5 px-4">মন্তব্য</th>
                  <th className="py-3.5 px-4 text-right">কাজ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EFE2]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#16402C] whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                      {log.dungInputKg} কেজি
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      {log.waterInputLiters} লিটার
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#16402C] whitespace-nowrap">
                      {log.burnHoursToday} ঘণ্টা
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#2A7A50] whitespace-nowrap">
                      {log.slurryProducedBags} বস্তা
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 text-xs whitespace-nowrap">
                      {log.recordedBy || 'করিম হাসান'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      {log.notes || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(log)}
                          title="সম্পাদন করুন"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#16402C] hover:bg-[#FAF7F0]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteLog && (
                          <button
                            onClick={() => onDeleteLog(log.id)}
                            title="মুছে ফেলুন"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <Flame className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">এই সময়কালে বায়োগ্যাসের কোনো হিসাব পাওয়া যায়নি।</p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 px-4 py-2 rounded-xl bg-[#16402C] text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#E5B842]" />
              <span>প্রথম হিসাবটি লিখুন</span>
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Biogas Log Modal */}
      {showLogModal && (
        <AddBiogasLogModal
          isOpen={showLogModal}
          onClose={() => {
            setShowLogModal(false);
            setEditingLog(null);
          }}
          onSave={async (log) => {
            if (editingLog && onUpdateLog) {
              await onUpdateLog(log);
            } else {
              await onAddLog(log);
            }
            setShowLogModal(false);
            setEditingLog(null);
            return { success: true };
          }}
          employees={employees}
          initialLog={editingLog}
        />
      )}

      {/* Safety Inspection Modal */}
      {showInspectionModal && (
        <BiogasInspectionModal
          isOpen={showInspectionModal}
          onClose={() => setShowInspectionModal(false)}
          onSaveInspection={async (item) => {
            if (onAddInspection) {
              return await onAddInspection(item);
            }
            setShowInspectionModal(false);
            return { success: true };
          }}
          employees={employees}
        />
      )}
    </div>
  );
};
