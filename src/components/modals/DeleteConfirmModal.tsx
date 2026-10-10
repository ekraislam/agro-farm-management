import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { FinancialRecord } from '../../types/farm';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  record: FinancialRecord | null;
  isDeleting?: boolean;
}

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  record,
  isDeleting = false,
}: DeleteConfirmModalProps) => {
  if (!isOpen || !record) return null;

  const isIncome = record.type === 'income';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-red-50 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/10 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">হিসাব মুছে ফেলার সতর্কতা</h3>
              <p className="text-xs text-red-700 mt-0.5">মুছে ফেললে এই হিসাবটি আর পাওয়া যাবে না</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            আপনি কি নিশ্চিত যে নিচের এই হিসাবটি তালিকা থেকে মুছে ফেলতে চান?
          </p>

          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#EAE2D0] space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-500">বিবরণ:</span>
              <span className="text-sm font-bold text-gray-900 text-right">{record.title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500">ধরন:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isIncome ? 'জমা (আয়)' : 'খরচ (ব্যয়)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500">টাকার পরিমাণ:</span>
              <span className={`text-base font-bold ${
                isIncome ? 'text-[#16402C]' : 'text-[#9E2A2B]'
              }`}>
                ৳ {record.amount.toLocaleString('en-US')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500">তারিখ:</span>
              <span className="text-xs text-gray-700">{record.date}</span>
            </div>
            {record.relatedMilkRecordId && (
              <div className="mt-2 pt-2 border-t border-[#EAE2D0] text-[11px] text-amber-700">
                ℹ️ এটি দুধ বিক্রির টাকার সাথে যুক্ত। মুছে ফেললে মোট জমার হিসাব কমে যাবে।
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-xs md:text-sm transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs md:text-sm shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>{isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
