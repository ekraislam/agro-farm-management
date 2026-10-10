import { useState } from 'react';
import { 
  Wallet, 
  X, 
  AlertCircle, 
  FileText, 
  Info,
  CheckCircle2
} from 'lucide-react';
import type { Employee, FinancialRecord } from '../../types/farm';
import { calculatePayrollStatus, validateSalaryPayment } from '../../utils/employeeAccounting';

interface RecordSalaryPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePayment: (paymentParams: {
    employee: Employee;
    amount: number;
    paymentMethod: 'cash' | 'bkash' | 'bank';
    salaryPeriod: string;
    paymentDate: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  employees: Employee[];
  initialEmployeeId?: string;
  financialRecords: FinancialRecord[];
}

export const RecordSalaryPaymentModal = ({
  isOpen,
  onClose,
  onSavePayment,
  employees,
  initialEmployeeId,
  financialRecords,
}: RecordSalaryPaymentModalProps) => {
  const activeEmployees = employees.filter((e) => !e.isArchived);
  const defaultEmpId = initialEmployeeId || (activeEmployees.length > 0 ? activeEmployees[0].id : '');

  const [selectedEmpId, setSelectedEmpId] = useState(defaultEmpId);
  const [salaryPeriod, setSalaryPeriod] = useState('2026-10');
  const [paymentDate, setPaymentDate] = useState('2026-10-10');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'bank'>('cash');
  const [notes, setNotes] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentEmployee = employees.find((e) => e.id === selectedEmpId) || activeEmployees[0];
  const payrollStatus = currentEmployee 
    ? calculatePayrollStatus(currentEmployee, financialRecords, salaryPeriod)
    : null;

  const [amount, setAmount] = useState(payrollStatus ? String(payrollStatus.dueAmount > 0 ? payrollStatus.dueAmount : currentEmployee?.salaryMonthly || 10000) : '10000');

  if (!isOpen) return null;

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      const status = calculatePayrollStatus(emp, financialRecords, salaryPeriod);
      setAmount(String(status.dueAmount > 0 ? status.dueAmount : emp.salaryMonthly));
    }
  };

  const handlePeriodChange = (period: string) => {
    setSalaryPeriod(period);
    if (currentEmployee) {
      const status = calculatePayrollStatus(currentEmployee, financialRecords, period);
      setAmount(String(status.dueAmount > 0 ? status.dueAmount : currentEmployee.salaryMonthly));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');

    if (!currentEmployee) {
      setErrorBanner('কর্মচারী নির্বাচন করুন।');
      return;
    }

    const numAmount = parseFloat(amount);
    const validation = validateSalaryPayment(
      currentEmployee,
      numAmount,
      salaryPeriod,
      financialRecords,
      paymentDate
    );

    if (!validation.isValid) {
      setErrorBanner(validation.error || 'বেতন পরিশোধের তথ্য সঠিক নয়।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSavePayment({
        employee: currentEmployee,
        amount: numAmount,
        paymentMethod,
        salaryPeriod,
        paymentDate,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorBanner(res.error || 'বেতন লেনদেন সংরক্ষণ করতে ব্যর্থ হয়েছে।');
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
            <div className="p-2.5 rounded-2xl bg-[#16402C]/10 text-[#16402C]">
              <Wallet className="w-5 h-5 text-[#16402C]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#16402C]">কর্মচারীর বেতন পরিশোধ</h3>
              <p className="text-xs text-gray-500 mt-0.5">খামারের খরচের খাতায় যুক্ত হবে</p>
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

          {/* Employee Selection */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              কর্মচারী নির্বাচন করুন <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-gray-900"
              required
            >
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} (মাসিক: ৳ {emp.salaryMonthly.toLocaleString('en-US')})
                </option>
              ))}
            </select>
          </div>

          {/* Month / Salary Period & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                বেতনের মাস <span className="text-red-500">*</span>
              </label>
              <select
                value={salaryPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold"
              >
                <option value="2026-10">অক্টোবর ২০২৬</option>
                <option value="2026-09">সেপ্টেম্বর ২০২৬</option>
                <option value="2026-08">আগস্ট ২০২৬</option>
                <option value="2026-11">নভেম্বর ২০২৬</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                পরিশোধের তারিখ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium"
                required
              />
            </div>
          </div>

          {/* Current Payroll State Box */}
          {payrollStatus && currentEmployee && (
            <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[#EAE2D0] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">নির্ধারিত মাসিক বেতন:</span>
                <span className="font-bold text-gray-900">৳ {currentEmployee.salaryMonthly.toLocaleString('en-US')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">পূর্বে পরিশোধ করা হয়েছে:</span>
                <span className="font-bold text-[#2A7A50]">৳ {payrollStatus.paidAmount.toLocaleString('en-US')}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#EAE2D0]">
                <span className="font-bold text-gray-700">বর্তমান বকেয়া:</span>
                <span className={`font-bold ${payrollStatus.dueAmount > 0 ? 'text-[#C53030]' : 'text-[#2A7A50]'}`}>
                  ৳ {payrollStatus.dueAmount.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              প্রদেয় বেতনের পরিমাণ (টাকা) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-gray-500 text-base">৳</span>
              <input
                type="number"
                min="1"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-[#16402C] text-base"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              পেমেন্ট মাধ্যম <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'নগদ ক্যাশ' },
                { id: 'bkash', label: 'বিকাশ' },
                { id: 'bank', label: 'ব্যাংক' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                    paymentMethod === m.id
                      ? 'bg-[#16402C] text-white border-[#16402C] shadow-xs'
                      : 'bg-[#FAF7F0]/60 text-gray-700 border-[#EAE2D0] hover:bg-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>মন্তব্য / বিবরণ</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: চলতি মাসের অগ্রিম বা নিয়মিত বেতন পরিশোধ"
              className="w-full px-3.5 py-2 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 text-xs"
            />
          </div>

          {/* Confirmation Notice */}
          <div className="p-3 bg-[#EAF5EE] border border-[#C5E3D0] rounded-2xl flex items-start gap-2 text-xs text-[#1B4D35]">
            <Info className="w-4 h-4 text-[#2A7A50] shrink-0 mt-0.5" />
            <span>
              এই লেনদেনটি নিশ্চিত করলে সরাসরি খামারের <strong>আয়-ব্যয় (Finance)</strong> পাতায় কর্মচারীর বেতন বাবদ ৳ {Number(amount || 0).toLocaleString('en-US')} খরচ হিসেবে অন্তর্ভুক্ত হবে।
            </span>
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
              <CheckCircle2 className="w-4 h-4 text-[#E5B842]" />
              {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'বেতন পরিশোধ নিশ্চিত'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
