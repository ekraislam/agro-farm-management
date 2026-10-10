import { useState, type FormEvent } from 'react';
import { X, Receipt, AlertCircle, ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import type { FinancialRecord, TransactionType, ExpenseCategory, IncomeCategory } from '../../types/farm';
import { generateId } from '../../utils/id';
import { 
  EXPENSE_CATEGORIES, 
  INCOME_CATEGORIES, 
  validateFinancialTransaction 
} from '../../utils/accounting';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (record: FinancialRecord) => Promise<{ success: boolean; error?: string } | void> | void;
  onUpdateTransaction?: (record: FinancialRecord) => Promise<{ success: boolean; error?: string } | void> | void;
  initialType?: TransactionType;
  initialRecord?: FinancialRecord | null;
}

const AddExpenseModalDialog = ({
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  initialType = 'expense',
  initialRecord = null,
}: Omit<AddExpenseModalProps, 'isOpen'>) => {
  const isEditing = Boolean(initialRecord);

  const [type, setType] = useState<TransactionType>(initialRecord?.type || initialType);
  const [title, setTitle] = useState(initialRecord?.title || '');
  const [amount, setAmount] = useState(initialRecord?.amount ? String(initialRecord.amount) : '');
  const [category, setCategory] = useState<string>(initialRecord?.category || (initialType === 'income' ? 'milk_sale' : 'feed'));
  const [date, setDate] = useState(initialRecord?.date || '১০ অক্টোবর ২০২৬');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'bank'>(initialRecord?.paymentMethod || 'cash');
  const [recordedBy, setRecordedBy] = useState(initialRecord?.recordedBy || 'আব্বু (খামার মালিক)');
  const [notes, setNotes] = useState(initialRecord?.notes || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    const validation = validateFinancialTransaction({
      title: title.trim(),
      amount: amountNum,
      date,
      category: category as any,
      paymentMethod,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      return;
    }

    const categoryLabelBn =
      type === 'expense'
        ? EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || 'খরচ'
        : INCOME_CATEGORIES.find((c) => c.value === category)?.label || 'আয়';

    const recordData: FinancialRecord = {
      id: initialRecord ? initialRecord.id : generateId('fin'),
      date,
      type,
      category: category as ExpenseCategory | IncomeCategory,
      categoryLabelBn,
      title: title.trim(),
      amount: amountNum,
      paymentMethod,
      recordedBy,
      notes: notes.trim() || undefined,
      relatedMilkRecordId: initialRecord?.relatedMilkRecordId || undefined,
      createdAt: initialRecord?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      let result;
      if (isEditing && onUpdateTransaction) {
        result = await onUpdateTransaction(recordData);
      } else {
        result = await onAddTransaction(recordData);
      }

      setIsSubmitting(false);
      if (result && !result.success) {
        setError(result.error || 'আর্থিক লেনদেন সংরক্ষণ ব্যর্থ হয়েছে।');
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
        <div className={`p-5 md:p-6 text-white flex items-center justify-between rounded-t-3xl ${
          type === 'expense' ? 'bg-[#9E2A2B]' : 'bg-[#16402C]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 text-white">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                {isEditing 
                  ? 'লেনদেন সম্পাদনা করুন' 
                  : type === 'expense' ? 'নতুন খরচ যোগ করুন' : 'নতুন আয় যোগ করুন'}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">খামারের আর্থিক হিসাব নির্ভুল রাখুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
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

          {initialRecord?.relatedMilkRecordId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs">
              ℹ️ এই লেনদেনটি একটি দুধ বিক্রয়ের সাথে সংশ্লিষ্ট। টাকার পরিমাণ পরিবর্তন করলে মূল দুধের রেকর্ডের সাথে মিল থাকবে না।
            </div>
          )}

          {/* Type Toggle: Expense vs Income (Disabled in edit mode to preserve accounting integrity) */}
          {!isEditing ? (
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('feed');
                  setError('');
                }}
                className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'expense'
                    ? 'bg-white text-[#9E2A2B] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-[#9E2A2B]" />
                খরচ (Expense)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('milk_sale');
                  setError('');
                }}
                className={`py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'income'
                    ? 'bg-white text-[#16402C] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-[#16402C]" />
                আয় (Income)
              </button>
            </div>
          ) : (
            <div className={`p-2.5 rounded-xl text-center text-xs font-bold ${
              type === 'income' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              লেনদেনের ধরন: {type === 'income' ? 'আয় (Income)' : 'ব্যয় (Expense)'}
            </div>
          )}

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              হিসাবের বিবরণ / শিরোনাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder={type === 'expense' ? 'যেমন: ৫ বস্তা গমের ভুসি ক্রয়' : 'যেমন: পাইকারি দুধ বিক্রয়'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white"
              required
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                টাকার পরিমাণ (৳) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">৳</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  placeholder="0"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm font-bold bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                খাত / ক্যাটাগরি *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm bg-white"
              >
                {type === 'expense'
                  ? EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))
                  : INCOME_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Date & Payment Method */}
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
                পরিশোধের মাধ্যম *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              >
                <option value="cash">নগদ (Cash)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="bank">ব্যাংক (Bank Transfer)</option>
              </select>
            </div>
          </div>

          {/* Recorded By */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              হিসাবকারী *
            </label>
            <select
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
            >
              <option value="আব্বু (খামার মালিক)">আব্বু (খামার মালিক)</option>
              <option value="মো: রহিম উদ্দিন">মো: রহিম উদ্দিন (প্রধান গোয়ালা)</option>
              <option value="করিম হাসান">করিম হাসান (সহকারী)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              মন্তব্য / রসিদ বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: দোকানের নাম, মেমো নম্বর, ইত্যাদি"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
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
              className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 ${
                type === 'expense'
                  ? 'bg-[#9E2A2B] hover:bg-[#801F20]'
                  : 'bg-[#16402C] hover:bg-[#123323]'
              }`}
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : isEditing ? 'হালনাগাদ করুন' : 'হিসাব সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddExpenseModal = (props: AddExpenseModalProps) => {
  if (!props.isOpen) return null;
  return (
    <AddExpenseModalDialog
      key={props.initialRecord ? `edit-${props.initialRecord.id}` : `new-${props.initialType || 'expense'}`}
      {...props}
    />
  );
};
