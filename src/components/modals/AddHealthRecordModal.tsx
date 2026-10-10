import { formatCurrency } from '../../utils/accounting';
import { useState, useEffect, type FormEvent } from 'react';
import { X, ShieldPlus, AlertCircle, Calendar, DollarSign, UserCheck, Stethoscope } from 'lucide-react';
import type { Cow, HealthRecord, HealthEventType } from '../../types/farm';
import { generateId } from '../../utils/id';
import { HEALTH_EVENT_LABELS, validateHealthRecord } from '../../utils/healthAccounting';

interface AddHealthRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  cows: Cow[];
  initialCowId?: string;
  onAddHealthRecord: (
    record: HealthRecord,
    createExpense: boolean
  ) => Promise<{ success: boolean; error?: string } | void> | void;
}

export const AddHealthRecordModal = ({
  isOpen,
  onClose,
  cows,
  initialCowId,
  onAddHealthRecord,
}: AddHealthRecordModalProps) => {
  const [selectedCowId, setSelectedCowId] = useState(initialCowId || cows[0]?.id || '');
  const [eventType, setEventType] = useState<HealthEventType>('vaccination');
  const [treatmentName, setTreatmentName] = useState('');
  const [doctorName, setDoctorName] = useState('ডা. আনিসুর রহমান (প্রাণিসম্পদ কর্মকর্তা)');
  const [eventDate, setEventDate] = useState('১০ অক্টোবর ২০২৬');
  const [nextDueDate, setNextDueDate] = useState('');
  const [cost, setCost] = useState('');
  const [createExpense, setCreateExpense] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialCowId) {
        setSelectedCowId(initialCowId);
      } else if (cows.length > 0) {
        setSelectedCowId(cows[0].id);
      }
      setEventType('vaccination');
      setTreatmentName('');
      setCost('');
      setCreateExpense(false);
      setNextDueDate('');
      setNotes('');
      setError('');
    }
  }, [isOpen, initialCowId, cows]);

  if (!isOpen) return null;

  const costNumber = cost ? parseFloat(cost) : 0;
  const targetCow = cows.find((c) => c.id === selectedCowId);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCowId) {
      setError('অনুগ্রহ করে গাভী বা গরু নির্বাচন করুন।');
      return;
    }

    const validation = validateHealthRecord({
      cowId: selectedCowId,
      eventType,
      treatmentName,
      eventDate,
      cost: cost ? parseFloat(cost) : undefined,
    });

    if (!validation.isValid) {
      setError(Object.values(validation.errors)[0]);
      return;
    }

    const newRecord: HealthRecord = {
      id: generateId('hr'),
      cowId: selectedCowId,
      cowTag: targetCow?.tagNumber || 'অজানা ট্যাগ',
      cowName: targetCow?.name,
      eventType,
      eventTypeLabelBn: HEALTH_EVENT_LABELS[eventType],
      eventDate: eventDate.trim(),
      nextDueDate: nextDueDate.trim() || undefined,
      treatmentName: treatmentName.trim(),
      doctorName: doctorName.trim() || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      const result = await onAddHealthRecord(newRecord, createExpense && costNumber > 0);
      setIsSubmitting(false);
      if (result && !result.success) {
        setError(result.error || 'স্বাস্থ্য রেকর্ড সংরক্ষণ ব্যর্থ হয়েছে।');
        return;
      }
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFC9] flex flex-col">
        {/* Header */}
        <div className="p-5 md:p-6 bg-[#16402C] text-white flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-[#E5B842]">
              <ShieldPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">টিকা ও চিকিৎসার হিসাব যোগ করুন</h2>
              <p className="text-xs text-white/80 mt-0.5">গরুর চিকিৎসা, টিকা ও ঔষধের হিসাব</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cow Selection & Event Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                গরু নির্বাচন *
              </label>
              <select
                value={selectedCowId}
                onChange={(e) => setSelectedCowId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
                required
              >
                {cows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tagNumber} — {c.name} ({c.breed})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                সেবার ধরন *
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as HealthEventType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              >
                <option value="vaccination">টিকা প্রদান</option>
                <option value="deworming">কৃমিনাশক ওষুধ</option>
                <option value="vet_consultation">ডাক্তারের পরামর্শ</option>
                <option value="treatment">অসুস্থতা ও সাধারণ চিকিৎসা</option>
                <option value="other">অন্যান্য সেবা</option>
              </select>
            </div>
          </div>

          {/* Treatment / Vaccine Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              টিকা / ঔষধ / চিকিৎসার নাম *
            </label>
            <input
              type="text"
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
              placeholder="যেমন: খুরারোগের টিকা, অ্যানথ্রাক্স, কৃমিনাশক ট্যাবলেট"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm"
              required
            />
          </div>

          {/* Doctor / Provider */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
              পশুচিকিৎসক বা প্রদানকারীর নাম
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="যেমন: ডা. আনিসুর রহমান (প্রাণিসম্পদ কর্মকর্তা)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
            />
          </div>

          {/* Date & Next Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0]">
            <div>
              <label className="block text-xs font-bold text-[#16402C] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#16402C]" />
                প্রদানের তারিখ *
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="যেমন: ১০ অক্টোবর ২০২৬"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#936709] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#936709]" />
                পরবর্তী টিকা বা ডাক্তার দেখানোর তারিখ (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                placeholder="যেমন: ১০ জানুয়ারি ২০২৭"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] text-sm bg-white"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">
                তারিখ দিলে জরুরি কাজের তালিকায় স্বয়ংক্রিয়ভাবে যোগ হবে
              </span>
            </div>
          </div>

          {/* Cost & Explicit Financial Expense Toggle */}
          <div className="p-3.5 bg-white rounded-2xl border border-gray-200 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                চিকিৎসা বা ঔষধের খরচ (টাকা, ঐচ্ছিক)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">৳</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={cost}
                  onChange={(e) => {
                    setCost(e.target.value);
                    if (!e.target.value) setCreateExpense(false);
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] text-sm bg-white"
                />
              </div>
            </div>

            {costNumber > 0 && (
              <div className="p-3 bg-[#EAF5EE] border border-[#C5E3D0] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="health-expense-toggle"
                      className="text-xs font-bold text-[#16402C] block cursor-pointer"
                    >
                      খামারের খরচের খাতায় এই হিসাব যোগ করবেন?
                    </label>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      টিক দিলে ৳{formatCurrency(costNumber)} টাকা খরচের খাতায় যোগ হবে
                    </p>
                  </div>
                  <input
                    id="health-expense-toggle"
                    type="checkbox"
                    checked={createExpense}
                    onChange={(e) => setCreateExpense(e.target.checked)}
                    className="w-5 h-5 accent-[#16402C] cursor-pointer rounded"
                  />
                </div>
                {createExpense && (
                  <p className="text-[11px] text-[#2A7A50] font-medium flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    খরচের খাতায় 'পশুচিকিৎসা ও ঔষধ' বাবদ ৳{formatCurrency(costNumber)} যোগ হবে।
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              মন্তব্য বা ডাক্তারের পরামর্শ (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: কয় বেলা ওষুধ খাওয়াতে হবে, বিশেষ কোনো নির্দেশনা ইত্যাদি"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-semibold text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldPlus className="w-4 h-4 text-[#E5B842]" />
              )}
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'হিসাব সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
