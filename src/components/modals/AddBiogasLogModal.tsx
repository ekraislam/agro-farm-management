import { useState } from 'react';
import { 
  Flame, 
  X, 
  Droplet, 
  Clock, 
  Sprout, 
  FileText, 
  AlertCircle,
  UserCheck
} from 'lucide-react';
import type { BiogasDailyLog, Employee } from '../../types/farm';
import { validateBiogasLog } from '../../utils/biogasAccounting';
import { generateId } from '../../utils/id';

interface AddBiogasLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: BiogasDailyLog) => Promise<{ success: boolean; error?: string }>;
  employees: Employee[];
  initialLog?: BiogasDailyLog | null;
}

export const AddBiogasLogModal = ({
  isOpen,
  onClose,
  onSave,
  employees,
  initialLog,
}: AddBiogasLogModalProps) => {
  const [date, setDate] = useState(initialLog?.date || '2026-10-10');
  const [dungKg, setDungKg] = useState(initialLog ? String(initialLog.dungInputKg) : '110');
  const [waterLiters, setWaterLiters] = useState(initialLog ? String(initialLog.waterInputLiters) : '110');
  const [burnHours, setBurnHours] = useState(initialLog ? String(initialLog.burnHoursToday) : '5.5');
  const [slurryBags, setSlurryBags] = useState(initialLog ? String(initialLog.slurryProducedBags) : '2');
  const [recordedByEmpId, setRecordedByEmpId] = useState(initialLog?.recordedByEmployeeId || '');
  const [notes, setNotes] = useState(initialLog?.notes || '');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [errorBanner, setErrorBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDungChange = (val: string) => {
    setDungKg(val);
    // Suggest 1:1 water mixture ratio by default
    if (!waterLiters || waterLiters === dungKg) {
      setWaterLiters(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');

    const logData: Partial<BiogasDailyLog> = {
      date: date.trim(),
      dungInputKg: parseFloat(dungKg) || 0,
      waterInputLiters: parseFloat(waterLiters) || 0,
      burnHoursToday: parseFloat(burnHours) || 0,
      slurryProducedBags: parseInt(slurryBags) || 0,
      recordedByEmployeeId: recordedByEmpId || undefined,
      notes: notes.trim(),
    };

    const validation = validateBiogasLog(logData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setErrorBanner('অনুগ্রহ করে সঠিক সংখ্যা ও মান প্রদান করুন।');
      return;
    }

    const assignedWorker = employees.find((e) => e.id === recordedByEmpId);

    setIsSubmitting(true);
    const logToSave: BiogasDailyLog = {
      id: initialLog ? initialLog.id : generateId('bg'),
      date: date.trim(),
      dungInputKg: parseFloat(dungKg) || 0,
      waterInputLiters: parseFloat(waterLiters) || 0,
      gasPressurePsi: initialLog?.gasPressurePsi ?? 2.3,
      burnHoursToday: parseFloat(burnHours) || 0,
      slurryProducedBags: parseInt(slurryBags) || 0,
      status: 'optimal',
      statusBn: 'চমৎকার কার্যক্ষম',
      recordedByEmployeeId: recordedByEmpId || undefined,
      recordedBy: assignedWorker?.name || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const res = await onSave(logToSave);
      if (!res.success) {
        setErrorBanner(res.error || 'বায়োগ্যাস লগ সংরক্ষণ করা সম্ভব হয়নি।');
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
            <div className="p-2.5 rounded-2xl bg-[#E5B842]/20 text-[#8C6200]">
              <Flame className="w-5 h-5 text-[#8C6200]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#16402C]">
                {initialLog ? 'বায়োগ্যাস হিসাব সংশোধন' : 'দৈনিক বায়োগ্যাসে গোবর দেওয়ার হিসাব'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">গোবর ও পানি মেশানো এবং চুলা জ্বলার হিসাব</p>
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

          {/* Date */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              তারিখ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium"
              required
            />
          </div>

          {/* Dung & Water Inputs (1:1 Ratio) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#8C6200]" />
                <span>গোবর দেওয়া হয়েছে (কেজি)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={dungKg}
                onChange={(e) => handleDungChange(e.target.value)}
                placeholder="১১০"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  formErrors.dungInputKg ? 'border-red-400' : 'border-[#EAE2D0]'
                } outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-[#16402C]`}
                required
              />
              {formErrors.dungInputKg && (
                <p className="text-[11px] text-red-600 mt-1">{formErrors.dungInputKg}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-[#2A7A50]" />
                <span>পানি মেশানো হয়েছে (লিটার)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={waterLiters}
                onChange={(e) => setWaterLiters(e.target.value)}
                placeholder="১১০"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  formErrors.waterInputLiters ? 'border-red-400' : 'border-[#EAE2D0]'
                } outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-[#16402C]`}
                required
              />
              {formErrors.waterInputLiters && (
                <p className="text-[11px] text-red-600 mt-1">{formErrors.waterInputLiters}</p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-gray-500 italic">
            * নিয়ম: ভালো গ্যাস পাওয়ার জন্য গোবর ও পানির পরিমাণ সমান সমান (১:১) রাখবেন।
          </p>

          {/* Burn Hours & Slurry Produced */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>চুলা জ্বলার সময় (ঘণ্টা)</span>
              </label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={burnHours}
                onChange={(e) => setBurnHours(e.target.value)}
                placeholder="৫.৫"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  formErrors.burnHoursToday ? 'border-red-400' : 'border-[#EAE2D0]'
                } outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-gray-900`}
                required
              />
              {formErrors.burnHoursToday && (
                <p className="text-[11px] text-red-600 mt-1">{formErrors.burnHoursToday}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-[#2A7A50]" />
                <span>উৎপাদিত জৈব সার (বস্তা)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={slurryBags}
                onChange={(e) => setSlurryBags(e.target.value)}
                placeholder="২"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-[#2A7A50]"
                required
              />
            </div>
          </div>

          {/* Recorded By Employee Reference */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>কে গোবর দিয়েছেন (ঐচ্ছিক)</span>
            </label>
            <select
              value={recordedByEmpId}
              onChange={(e) => setRecordedByEmpId(e.target.value)}
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

          {/* Maintenance & Notes */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>মন্তব্য বা পর্যবেক্ষণ (ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: গ্যাসের চাপ ভালো আছে, চুলা পরিষ্কার করা হয়েছে"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 text-xs"
            />
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
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'হিসাব সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
