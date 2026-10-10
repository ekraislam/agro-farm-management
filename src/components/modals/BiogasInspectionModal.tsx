import { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  FileText, 
  UserCheck,
  AlertCircle
} from 'lucide-react';
import type { BiogasInspectionItem, Employee } from '../../types/farm';
import { BIOGAS_CHECKLIST_TEMPLATES, BIOGAS_SAFETY_GUIDANCE } from '../../utils/biogasAccounting';
import { generateId } from '../../utils/id';

interface BiogasInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInspection: (item: BiogasInspectionItem) => Promise<{ success: boolean; error?: string }>;
  employees: Employee[];
}

export const BiogasInspectionModal = ({
  isOpen,
  onClose,
  onSaveInspection,
  employees,
}: BiogasInspectionModalProps) => {
  const [date, setDate] = useState('2026-10-10');
  const [itemKey, setItemKey] = useState<'inlet' | 'pipes' | 'safety_valve' | 'slurry_outlet' | 'cleanliness'>('safety_valve');
  const [status, setStatus] = useState<'good' | 'needs_attention' | 'urgent'>('good');
  const [inspectorEmpId, setInspectorEmpId] = useState(employees[1]?.id || employees[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [nextDate, setNextDate] = useState('2026-10-24');
  const [errorBanner, setErrorBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentTemplate = BIOGAS_CHECKLIST_TEMPLATES.find((t) => t.itemKey === itemKey) || BIOGAS_CHECKLIST_TEMPLATES[0];
  const assignedInspector = employees.find((e) => e.id === inspectorEmpId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');

    setIsSubmitting(true);
    const item: BiogasInspectionItem = {
      id: generateId('insp'),
      date,
      itemKey,
      itemNameBn: currentTemplate.itemNameBn,
      status,
      statusBn: status === 'good' ? 'স্বাভাবিক ও নিরাপদ' : status === 'needs_attention' ? 'যত্ন প্রয়োজন' : 'জরুরি পদক্ষেপ আবশ্যক',
      inspectorEmployeeId: inspectorEmpId || undefined,
      inspectorName: assignedInspector?.name || undefined,
      notes: notes.trim() || undefined,
      nextInspectionDate: nextDate || undefined,
    };

    try {
      const res = await onSaveInspection(item);
      if (!res.success) {
        setErrorBanner(res.error || 'পরিদর্শন রেকর্ড সংরক্ষণ ব্যর্থ হয়েছে।');
      } else {
        onClose();
      }
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'অপ্রত্যাশিত সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8DFC9] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#F2ECE1] flex items-center justify-between bg-[#FAF7F0]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#2A7A50]/15 text-[#2A7A50]">
              <ShieldCheck className="w-5 h-5 text-[#2A7A50]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#16402C]">বায়োগ্যাস প্ল্যান্ট নিরাপত্তা পরীক্ষা</h3>
              <p className="text-xs text-gray-500 mt-0.5">নিরাপদে ব্যবহারের জন্য নিয়মিত পরীক্ষা ও যত্ন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs md:text-sm">
          {errorBanner && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-center gap-2 text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          {/* Checklist Item Selection */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              কি পরীক্ষা করবেন? <span className="text-red-500">*</span>
            </label>
            <select
              value={itemKey}
              onChange={(e) => setItemKey(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-gray-900"
              required
            >
              {BIOGAS_CHECKLIST_TEMPLATES.map((tmpl) => (
                <option key={tmpl.itemKey} value={tmpl.itemKey}>
                  {tmpl.itemNameBn} ({tmpl.recommendedFrequencyBn})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">{currentTemplate.descriptionBn}</p>
          </div>

          {/* Date & Next Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                আজকের তারিখ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE2D0] bg-[#FAF7F0]/40 text-xs font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                পরের বার কবে পরীক্ষা করবেন
              </label>
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE2D0] bg-[#FAF7F0]/40 text-xs font-medium"
              />
            </div>
          </div>

          {/* Result Status */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              অবস্থা কেমন পাওয়া গেল? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('good')}
                className={`py-2.5 px-2 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                  status === 'good'
                    ? 'bg-[#EAF5EE] border-[#2A7A50] text-[#1B4D35] font-bold shadow-xs'
                    : 'bg-[#FAF7F0]/60 border-[#EAE2D0] text-gray-700 hover:bg-white'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${status === 'good' ? 'text-[#2A7A50]' : 'text-gray-400'}`} />
                <span className="text-[11px]">নিরাপদ</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('needs_attention')}
                className={`py-2.5 px-2 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                  status === 'needs_attention'
                    ? 'bg-[#FFFBEB] border-[#D97706] text-[#92400E] font-bold shadow-xs'
                    : 'bg-[#FAF7F0]/60 border-[#EAE2D0] text-gray-700 hover:bg-white'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 ${status === 'needs_attention' ? 'text-[#D97706]' : 'text-gray-400'}`} />
                <span className="text-[11px]">যত্ন প্রয়োজন</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('urgent')}
                className={`py-2.5 px-2 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                  status === 'urgent'
                    ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B] font-bold shadow-xs'
                    : 'bg-[#FAF7F0]/60 border-[#EAE2D0] text-gray-700 hover:bg-white'
                }`}
              >
                <AlertOctagon className={`w-4 h-4 ${status === 'urgent' ? 'text-[#DC2626]' : 'text-gray-400'}`} />
                <span className="text-[11px]">জরুরি মেরামত দরকার</span>
              </button>
            </div>
          </div>

          {/* Inspector Selection */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>কে পরীক্ষা করেছেন?</span>
            </label>
            <select
              value={inspectorEmpId}
              onChange={(e) => setInspectorEmpId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium"
            >
              <option value="">কর্মী নির্বাচন করুন (ঐচ্ছিক)</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>মন্তব্য বা পর্যবেক্ষণ (ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: সাবান পানি দিয়ে লিক পরীক্ষা করা হয়েছে, কোনো গন্ধ নেই"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 text-xs"
            />
          </div>

          {/* Safety Disclaimer */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed">
            <span className="font-bold block mb-0.5">⚠️ নিরাপত্তা নির্দেশনা:</span>
            {BIOGAS_SAFETY_GUIDANCE.emergencyRule}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#F2ECE1] flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-[#EAE2D0] text-gray-700 font-semibold hover:bg-gray-50 active:scale-95 transition-all text-xs"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold shadow-xs active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'পরীক্ষার হিসাব সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
