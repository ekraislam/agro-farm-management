import { useState } from 'react';
import { AlertTriangle, Archive, Trash2, X, ShieldAlert } from 'lucide-react';
import type { Cow } from '../../types/farm';

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  cow: Cow | null;
  hasHistoricalRecords: boolean;
  milkRecordCount: number;
  healthRecordCount: number;
  onConfirm: () => Promise<void> | void;
}

export const ArchiveConfirmModal = ({
  isOpen,
  onClose,
  cow,
  hasHistoricalRecords,
  milkRecordCount,
  healthRecordCount,
  onConfirm,
}: ArchiveConfirmModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !cow) return null;

  const handleAction = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E8DFC9] shadow-2xl space-y-4">
        {/* Header Icon */}
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
            {hasHistoricalRecords ? (
              <Archive className="w-6 h-6 text-amber-700" />
            ) : (
              <Trash2 className="w-6 h-6 text-red-600" />
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {hasHistoricalRecords
              ? `${cow.tagNumber} (${cow.name}) পুরোনো তালিকায় সরাতে চান?`
              : `${cow.tagNumber} (${cow.name}) মুছে ফেলতে চান?`}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            খামারের হিসাব ও রেকর্ড সংরক্ষণের সতর্কতা
          </p>
        </div>

        {/* Explanation Alert */}
        {hasHistoricalRecords ? (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>পূর্বের হিসাবের নিরাপত্তা</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              এই গরুর সাথে <strong>{milkRecordCount} টি দুধের হিসাব</strong> এবং{' '}
              <strong>{healthRecordCount} টি চিকিৎসার তথ্য</strong> যুক্ত আছে।
            </p>
            <p className="text-gray-600 leading-relaxed">
              খামারের সঠিক হিসাব বজায় রাখার জন্য গরুটির তথ্য স্থায়ীভাবে মুছে না ফেলে <strong>পুরোনো তালিকায় (আর্কাইভ) রাখা হবে</strong>। এতে আগের দুধ বিক্রি ও খরচের কোনো হিসাবে গরমিল হবে না।
            </p>
          </div>
        ) : (
          <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-red-900 text-xs">
            <div className="flex items-center gap-2 font-bold text-red-900 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>সতর্কতা</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              এই গরুর সাথে পূর্বে কোনো দুধ বা চিকিৎসার হিসাব যুক্ত নেই। মুছে ফেললে এটি তালিকা থেকে চিরতরে চলে যাবে।
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold text-xs transition-colors"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleAction}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-60 ${
              hasHistoricalRecords
                ? 'bg-amber-700 hover:bg-amber-800'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isProcessing ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : hasHistoricalRecords ? (
              <Archive className="w-4 h-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>
              {isProcessing
                ? 'কাজ চলছে...'
                : hasHistoricalRecords
                ? 'পুরোনো তালিকায় রাখুন'
                : 'স্থায়ীভাবে মুছুন'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
