import { useState, useEffect, type FormEvent } from 'react';
import { X, Droplets, Check, AlertCircle, Info, DollarSign } from 'lucide-react';
import type { Cow, MilkRecord, Employee } from '../../types/farm';
import { generateId } from '../../utils/id';

interface AddMilkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (
    record: MilkRecord,
    paymentMethod?: 'cash' | 'bkash' | 'bank'
  ) => Promise<{ success: boolean; error?: string } | void> | void;
  cows: Cow[];
  initialCowId?: string;
  employees?: Employee[];
  ownerName?: string;
  defaultMilkRate?: number;
}

export const AddMilkModal = ({
  isOpen,
  onClose,
  onAddRecord,
  cows,
  initialCowId,
  employees = [],
  ownerName = 'মুমিনুল ইসলাম',
  defaultMilkRate = 80,
}: AddMilkModalProps) => {
  const activeEmployees = employees.filter((e) => !e.isArchived && e.status === 'active');
  const defaultRecorder = `${ownerName} (মালিক)`;

  const [date, setDate] = useState('১০ অক্টোবর ২০২৬');
  const [selectedCowId, setSelectedCowId] = useState('all');
  const [morningLiters, setMorningLiters] = useState('');
  const [eveningLiters, setEveningLiters] = useState('');
  const [isSold, setIsSold] = useState(true);
  const [soldLiters, setSoldLiters] = useState('');
  const [isCustomSold, setIsCustomSold] = useState(false);
  const [pricePerLiter, setPricePerLiter] = useState(String(defaultMilkRate || 80));
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'bank'>('cash');
  const [recordedBy, setRecordedBy] = useState(defaultRecorder);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (initialCowId && initialCowId !== 'all') {
      setSelectedCowId(initialCowId);
      const targetCow = cows.find((c) => c.id === initialCowId);
      if (targetCow && targetCow.dailyAvgMilkLiters > 0) {
        const half = Math.round((targetCow.dailyAvgMilkLiters / 2) * 10) / 10;
        setMorningLiters(String(half));
        setEveningLiters(String(Math.round((targetCow.dailyAvgMilkLiters - half) * 10) / 10));
      } else {
        setMorningLiters('');
        setEveningLiters('');
      }
    } else {
      setSelectedCowId('all');
      setMorningLiters('');
      setEveningLiters('');
    }

    setSoldLiters('');
    setIsCustomSold(false);
    setPricePerLiter(String(defaultMilkRate || 80));
    setRecordedBy(`${ownerName} (মালিক)`);
    setError('');
  }, [isOpen, initialCowId, cows, ownerName, defaultMilkRate]);

  // Derived liter calculations
  const morningNum = parseFloat(morningLiters) || 0;
  const eveningNum = parseFloat(eveningLiters) || 0;
  const totalLiters = Math.round((morningNum + eveningNum) * 10) / 10;

  // Auto-sync sold liters with total collected milk unless user explicitly edited it
  useEffect(() => {
    if (!isCustomSold) {
      setSoldLiters(totalLiters > 0 ? String(totalLiters) : '');
    }
  }, [totalLiters, isCustomSold]);

  if (!isOpen) return null;

  // Effective sold liters handles blank cleanly
  const effectiveSoldLiters = isSold
    ? (soldLiters.trim() !== ''
        ? parseFloat(soldLiters) || 0
        : (!isCustomSold && totalLiters > 0 ? totalLiters : 0))
    : 0;

  const priceNum = isSold ? (parseFloat(pricePerLiter) || 0) : 0;
  const totalAmount = isSold ? Math.round(effectiveSoldLiters * priceNum) : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (totalLiters <= 0) {
      setError('অনুগ্রহ করে সকাল বা বিকালের দোয়ানো দুধের পরিমাণ (লিটার) লিখুন।');
      return;
    }

    if (isSold) {
      if (effectiveSoldLiters <= 0) {
        setError('বিক্রি করা দুধের পরিমাণ শূন্যের বেশি হতে হবে।');
        return;
      }
      if (effectiveSoldLiters > totalLiters) {
        setError(
          `বিক্রি করা দুধের পরিমাণ (${effectiveSoldLiters} লিটার) মোট সংগৃহীত দুধ (${totalLiters} লিটার) অপেক্ষা বেশি হতে পারে না।`
        );
        return;
      }
      if (priceNum <= 0) {
        setError('দুধ বিক্রির জন্য প্রতি লিটার বিক্রয় দর (টাকা) অবশ্যই শূন্যের বেশি হতে হবে।');
        return;
      }
    }

    const selectedCow = cows.find((c) => c.id === selectedCowId);
    const isIndividual = selectedCowId !== 'all';

    const newRecord: MilkRecord = {
      id: generateId('mr'),
      date,
      morningLiters: morningNum,
      eveningLiters: eveningNum,
      totalLiters,
      entryType: isIndividual ? 'individual' : 'aggregate',
      isSold,
      soldLiters: effectiveSoldLiters,
      pricePerLiter: priceNum,
      totalAmount,
      cowId: isIndividual ? selectedCowId : undefined,
      cowName: selectedCow ? `${selectedCow.tagNumber} (${selectedCow.name})` : 'সম্পূর্ণ খামার (সকল গাভী)',
      recordedBy,
      note: notes.trim() || (isSold ? 'দৈনিক নিয়মিত দুধ সংগ্রহ ও বিক্রয়' : 'দুধ সংগ্রহ (বাছুরের খাদ্য/খামার ব্যবহার)'),
    };

    setIsSubmitting(true);
    try {
      const result = await onAddRecord(newRecord, paymentMethod);
      setIsSubmitting(false);
      if (result && !result.success) {
        setError(result.error || 'দুধের হিসাব ক্লাউডে সংরক্ষণ করা সম্ভব হয়নি।');
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
        {/* Modal Header */}
        <div className="p-5 md:p-6 bg-[#16402C] text-white flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-[#E5B842]">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">দুধের নতুন হিসাব লিখুন</h2>
              <p className="text-xs text-white/80 mt-0.5">দৈনিক সকাল ও বিকালের দুধ দোয়ানো এবং বিক্রির হিসাব</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Date & Recorded By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                তারিখ *
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-gray-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                হিসাবকারী / গোয়ালা *
              </label>
              <select
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white font-medium"
              >
                <option value={`${ownerName} (মালিক)`}>{ownerName} (মালিক)</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={`${emp.name} (${emp.role})`}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cow selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              গরু নির্বাচন
            </label>
            <select
              value={selectedCowId}
              onChange={(e) => setSelectedCowId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white"
            >
              <option value="all">সম্পূর্ণ খামার (সকল দুধাল গাভী একত্রে)</option>
              {cows
                .filter((c) => c.status === 'milking')
                .map((cow) => (
                  <option key={cow.id} value={cow.id}>
                    {cow.tagNumber} - {cow.name} ({cow.breed})
                  </option>
                ))}
            </select>
          </div>

          {/* Liters: Morning & Evening */}
          <div className="p-4 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#16402C] mb-1">
                  সকালের দুধ (লিটার)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  value={morningLiters}
                  onChange={(e) => {
                    setMorningLiters(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] text-base font-semibold text-gray-900 bg-white"
                  placeholder="০.০"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#936709] mb-1">
                  বিকালের দুধ (লিটার)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  inputMode="decimal"
                  value={eveningLiters}
                  onChange={(e) => {
                    setEveningLiters(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] text-base font-semibold text-gray-900 bg-white"
                  placeholder="০.০"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#EAE2D0] flex justify-between items-center text-xs font-bold text-[#16402C]">
              <span>মোট দোয়ানো দুধ:</span>
              <span className="text-base font-extrabold text-[#16402C]">
                {totalLiters > 0 ? `${totalLiters} লিটার` : '০ লিটার'}
              </span>
            </div>
          </div>

          {/* Milk Accounting: Commercial Sale Toggle */}
          <div className="p-3.5 bg-white rounded-2xl border-2 border-[#16402C]/20 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-gray-900 block cursor-pointer" htmlFor="is-sold-toggle">
                  দোয়ানো দুধ কি বিক্রি করা হয়েছে?
                </label>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  দুধ বিক্রি করলে আয়ের খাতায় জমা হবে, বিক্রি না করলে শুধু খামারের হিসাব থাকবে
                </p>
              </div>
              <input
                id="is-sold-toggle"
                type="checkbox"
                checked={isSold}
                onChange={(e) => {
                  setIsSold(e.target.checked);
                  setError('');
                }}
                className="w-5 h-5 accent-[#16402C] cursor-pointer rounded"
              />
            </div>

            {isSold ? (
              <div className="pt-3 border-t border-gray-100 space-y-3">
                {/* Liters Sold & Price Per Liter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      বিক্রি করা দুধ (লিটার) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      inputMode="decimal"
                      value={soldLiters}
                      onChange={(e) => {
                        setSoldLiters(e.target.value);
                        setIsCustomSold(true);
                        setError('');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] text-sm bg-white font-bold"
                      placeholder={totalLiters > 0 ? String(totalLiters) : '০.০'}
                    />

                    {/* Village friendly quick adjustment buttons */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSoldLiters(totalLiters > 0 ? String(totalLiters) : '');
                          setIsCustomSold(false);
                          setError('');
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#EAE2D0] hover:bg-[#EAF5EE] text-[#16402C] font-bold cursor-pointer transition-colors"
                        title="সম্পূর্ণ সংগৃহীত দুধ বিক্রির হিসাব সেট করুন"
                      >
                        সবটুকু ({totalLiters} লিটার)
                      </button>
                      {totalLiters > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const half = Math.round((totalLiters / 2) * 10) / 10;
                            setSoldLiters(String(half));
                            setIsCustomSold(true);
                            setError('');
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#EAE2D0] hover:bg-[#EAF5EE] text-gray-700 font-semibold cursor-pointer transition-colors"
                        >
                          অর্ধেক ({Math.round((totalLiters / 2) * 10) / 10} লিটার)
                        </button>
                      )}
                      {soldLiters !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSoldLiters('');
                            setIsCustomSold(true);
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium cursor-pointer transition-colors"
                        >
                          খালি করুন
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      প্রতি লিটার দর (টাকা) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">৳</span>
                      <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={pricePerLiter}
                        onChange={(e) => {
                          setPricePerLiter(e.target.value);
                          setError('');
                        }}
                        placeholder={String(defaultMilkRate || 80)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 focus:border-[#16402C] text-sm bg-white font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      খামার রেট: ৳{defaultMilkRate || 80} / লিটার
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    টাকা পাওয়ার মাধ্যম
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'bkash', 'bank'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-[#16402C] text-white border-[#16402C]'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {method === 'cash' ? 'নগদ টাকা' : method === 'bkash' ? 'বিকাশ' : 'ব্যাংক'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total Calculated Revenue Display */}
                <div className="bg-[#EAF5EE] border border-[#C5E3D0] p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-600 block">
                      বিক্রি: <strong>{effectiveSoldLiters}</strong> লিটার (দর ৳{priceNum})
                    </span>
                    <span className="text-sm font-bold text-[#16402C]">
                      মোট বিক্রির টাকা: ৳ {totalAmount.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#2A7A50] font-semibold">
                    <Check className="w-4 h-4" />
                    <span>জমার খাতায় যুক্ত হবে</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  <strong>দুধ বিক্রি হয়নি:</strong> সংগৃহীত {totalLiters} লিটার দুধ বাছুরকে খাওয়ানো হয়েছে বা পরিবারের প্রয়োজনে রাখা হয়েছে। জমার খাতায় কোনো টাকা যোগ হবে না।
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              মন্তব্য (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: বাজারে বিক্রি, মিষ্টির দোকানে দেওয়া ইত্যাদি"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-semibold text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isSold ? (
                <DollarSign className="w-4 h-4 text-[#E5B842]" />
              ) : (
                <Droplets className="w-4 h-4 text-[#E5B842]" />
              )}
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'হিসাব সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
