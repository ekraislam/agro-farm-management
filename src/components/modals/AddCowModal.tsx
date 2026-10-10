import { useState, useEffect, type FormEvent } from 'react';
import { X, PlusCircle, Edit3, AlertCircle, Calendar, Hash, Tag, DollarSign, Activity } from 'lucide-react';
import type { Cow, CowStatus } from '../../types/farm';
import { generateId } from '../../utils/id';
import { validateCow } from '../../utils/milkAccounting';

interface AddCowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCow: (cow: Cow) => Promise<{ success: boolean; error?: string } | void> | void;
  existingCows: Cow[];
  initialCow?: Cow | null;
}

const COW_STATUS_MAP: Record<CowStatus, string> = {
  milking: 'দুধ দিচ্ছে (দুধাল গাভী)',
  pregnant: 'গর্ভবতী (গাভীন)',
  dry: 'দুধ দিচ্ছে না (শুকনো গাভী)',
  calf: 'বাছুর',
  sick: 'অসুস্থ / পরিচর্যায়',
  sold: 'বিক্রি হয়েছে',
  other: 'অন্যান্য',
};

export const AddCowModal = ({
  isOpen,
  onClose,
  onSaveCow,
  existingCows,
  initialCow,
}: AddCowModalProps) => {
  const isEditing = Boolean(initialCow);

  // Form states
  const [tagNumber, setTagNumber] = useState('');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('হলস্টাইন ফ্রিজিয়ান ক্রস (৭৫%)');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [isAgeEstimated, setIsAgeEstimated] = useState(true);
  const [ageYears, setAgeYears] = useState('3.5');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [status, setStatus] = useState<CowStatus>('milking');
  const [dailyAvgMilk, setDailyAvgMilk] = useState('14.0');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [lastVaccinatedDate, setLastVaccinatedDate] = useState('২০২৬-০৯-১৫');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [errorBanner, setErrorBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state on open or initialCow changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialCow) {
      setTagNumber(initialCow.tagNumber);
      setName(initialCow.name);
      setBreed(initialCow.breed);
      setGender(initialCow.gender || 'female');
      setIsAgeEstimated(initialCow.isAgeEstimated !== false);
      setAgeYears(String(initialCow.ageYears));
      setDateOfBirth(initialCow.dateOfBirth || '');
      setStatus(initialCow.status);
      setDailyAvgMilk(String(initialCow.dailyAvgMilkLiters || 0));
      setPurchaseDate(initialCow.purchaseDate || '');
      setPurchasePrice(initialCow.purchasePrice ? String(initialCow.purchasePrice) : '');
      setLastVaccinatedDate(initialCow.lastVaccinatedDate || '');
      setNotes(initialCow.notes || '');
    } else {
      const nextNum = existingCows.length + 1;
      const formattedNum = nextNum < 10 ? `০${nextNum}` : String(nextNum);
      setTagNumber(`গাভী-${formattedNum}`);
      setName('');
      setBreed('হলস্টাইন ফ্রিজিয়ান ক্রস (৭৫%)');
      setGender('female');
      setIsAgeEstimated(true);
      setAgeYears('3.5');
      setDateOfBirth('');
      setStatus('milking');
      setDailyAvgMilk('14.0');
      setPurchaseDate('');
      setPurchasePrice('');
      setLastVaccinatedDate('২০২৬-০৯-১৫');
      setNotes('');
    }
    setFormErrors({});
    setErrorBanner('');
  }, [isOpen, initialCow, existingCows.length]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setErrorBanner('');

    // Calculate age in years if verified dateOfBirth is entered
    let finalAge = parseFloat(ageYears) || 0;
    if (!isAgeEstimated && dateOfBirth) {
      const birth = new Date(dateOfBirth);
      if (!isNaN(birth.getTime())) {
        const diffMs = Date.now() - birth.getTime();
        const diffYears = Math.max(0.1, Math.round((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10);
        finalAge = diffYears;
      }
    }

    const cowToValidate: Partial<Cow> = {
      tagNumber: tagNumber.trim(),
      name: name.trim(),
      breed,
      ageYears: finalAge,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
    };

    const validation = validateCow(cowToValidate, existingCows, initialCow?.id);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setErrorBanner(Object.values(validation.errors)[0]);
      return;
    }

    const cowData: Cow = {
      id: initialCow ? initialCow.id : generateId('cow'),
      tagNumber: tagNumber.trim(),
      name: name.trim(),
      breed,
      gender,
      ageYears: finalAge,
      isAgeEstimated,
      dateOfBirth: !isAgeEstimated && dateOfBirth ? dateOfBirth : undefined,
      status,
      statusLabelBn: COW_STATUS_MAP[status],
      dailyAvgMilkLiters: status === 'milking' ? parseFloat(dailyAvgMilk) || 0 : 0,
      lastMilkingLiters: status === 'milking' ? Math.round((parseFloat(dailyAvgMilk) / 2) * 10) / 10 : 0,
      lastVaccinatedDate: lastVaccinatedDate.trim() || undefined,
      purchaseDate: purchaseDate.trim() || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      notes: notes.trim() || (isEditing ? initialCow?.notes : 'নতুন এন্ট্রি'),
      isArchived: initialCow?.isArchived || false,
      archivedAt: initialCow?.archivedAt,
      createdAt: initialCow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      const result = await onSaveCow(cowData);
      setIsSubmitting(false);
      if (result && !result.success) {
        setErrorBanner(result.error || 'গরুর তথ্য সংরক্ষণ করা সম্ভব হয়নি।');
        return;
      }
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorBanner(err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#E8DFC9] flex flex-col">
        {/* Header */}
        <div className="p-5 md:p-6 bg-[#16402C] text-white flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-[#E5B842]">
              {isEditing ? <Edit3 className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                {isEditing ? 'গরুর তথ্য সম্পাদনা করুন' : 'নতুন গরু তালিকাভুক্ত করুন'}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {isEditing ? 'প্রোফাইলের তথ্য ও অবস্থা হালনাগাদ করুন' : 'খামারের গরুর পূর্ণাঙ্গ জীবনবৃত্তান্ত ও হিসাব'}
              </p>
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
          {errorBanner && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          {/* Tag & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-gray-400" />
                ট্যাগ বা গরুর নম্বর *
              </label>
              <input
                type="text"
                value={tagNumber}
                onChange={(e) => {
                  setTagNumber(e.target.value);
                  setFormErrors((prev) => ({ ...prev, tagNumber: '' }));
                }}
                placeholder="যেমন: গাভী-০৯"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  formErrors.tagNumber ? 'border-red-400 bg-red-50/50' : 'border-gray-300'
                } focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm`}
                required
              />
              {formErrors.tagNumber && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.tagNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                গরুর নাম *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="যেমন: বকুল, চাঁদনী, লালু"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  formErrors.name ? 'border-red-400 bg-red-50/50' : 'border-gray-300'
                } focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm`}
                required
              />
              {formErrors.name && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{formErrors.name}</p>
              )}
            </div>
          </div>

          {/* Breed & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                গরুর জাত *
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              >
                <option value="হলস্টাইন ফ্রিজিয়ান ক্রস (৭৫%)">হলস্টাইন ফ্রিজিয়ান ক্রস (৭৫%)</option>
                <option value="হলস্টাইন ফ্রিজিয়ান (৫০%)">হলস্টাইন ফ্রিজিয়ান (৫০%)</option>
                <option value="শাহিওয়াল ক্রস">শাহিওয়াল ক্রস</option>
                <option value="শাহিওয়াল পিওর">শাহিওয়াল পিওর</option>
                <option value="জার্সি ক্রস">জার্সি ক্রস</option>
                <option value="দেশি উন্নত জাত">দেশি উন্নত জাত</option>
                <option value="অন্যান্য সংকর">অন্যান্য সংকর</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                গরুর ধরন (লিঙ্গ) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    gender === 'female'
                      ? 'bg-[#16402C] text-white border-[#16402C]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  গাভী / বকনা (মাদী)
                </button>
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    gender === 'male'
                      ? 'bg-[#16402C] text-white border-[#16402C]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ষাঁড় / বাছুর (মর্দা)
                </button>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-gray-400" />
              বর্তমান অবস্থা *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CowStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white font-medium"
            >
              <option value="milking">দুধ দিচ্ছে (দুধাল গাভী)</option>
              <option value="pregnant">গর্ভবতী (গাভীন)</option>
              <option value="dry">দুধ বন্ধ (শুকনো গাভী)</option>
              <option value="calf">বাছুর</option>
              <option value="sick">অসুস্থ / চিকিৎসাধীন</option>
              <option value="sold">বিক্রি হয়েছে</option>
              <option value="other">অন্যান্য</option>
            </select>
          </div>

          {/* Age Selection: Verified DOB vs Estimated Age */}
          <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#16402C]">বয়সের হিসাব নির্ধারণ</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAgeEstimated(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    isAgeEstimated
                      ? 'bg-[#16402C] text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  আনুমানিক বয়স
                </button>
                <button
                  type="button"
                  onClick={() => setIsAgeEstimated(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    !isAgeEstimated
                      ? 'bg-[#16402C] text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  যাচাইকৃত জন্মতারিখ
                </button>
              </div>
            </div>

            {isAgeEstimated ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  আনুমানিক বয়স (বছর)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  inputMode="decimal"
                  value={ageYears}
                  onChange={(e) => setAgeYears(e.target.value)}
                  placeholder="যেমন: ৩.৫"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  সঠিক জন্মতারিখ
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
                />
              </div>
            )}
          </div>

          {/* Daily Milk Production Estimate */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              দৈনিক গড় দুধের আনুমানিক হিসাব (লিটার)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              disabled={status !== 'milking'}
              value={status === 'milking' ? dailyAvgMilk : '০'}
              onChange={(e) => setDailyAvgMilk(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm disabled:bg-gray-100 disabled:text-gray-400"
            />
            {status !== 'milking' && (
              <span className="text-[11px] text-gray-400 mt-0.5 block">
                গাভী বর্তমানে দুধ দিচ্ছে না বলে এই মান প্রযোজ্য নয়
              </span>
            )}
          </div>

          {/* Purchase Details (Date and Price) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white rounded-2xl border border-gray-200">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                ক্রয়ের তারিখ (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                placeholder="যেমন: ১৫ জানুয়ারি ২০২৪"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                ক্রয় মূল্য (টাকা, ঐচ্ছিক)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="যেমন: ১,২০,০০০"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              />
            </div>
          </div>

          {/* Last Vaccine Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              সর্বশেষ টিকা দেওয়ার তারিখ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={lastVaccinatedDate}
              onChange={(e) => setLastVaccinatedDate(e.target.value)}
              placeholder="যেমন: ২০২৬-০৯-১৫"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              বিশেষ লক্ষণ বা মন্তব্য (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: শান্ত স্বভাবের, সুষম খাদ্য পছন্দ করে, প্রজনন তথ্য ইত্যাদি"
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
              ) : isEditing ? (
                <Edit3 className="w-4 h-4 text-[#E5B842]" />
              ) : (
                <PlusCircle className="w-4 h-4 text-[#E5B842]" />
              )}
              {isSubmitting
                ? 'সংরক্ষণ হচ্ছে...'
                : isEditing
                ? 'তথ্য হালনাগাদ করুন'
                : 'খামারে যুক্ত করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

