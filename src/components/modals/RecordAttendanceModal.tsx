import { useState } from 'react';
import { 
  Calendar, 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import type { Employee, AttendanceRecord, AttendanceStatus } from '../../types/farm';
import { ATTENDANCE_STATUS_LABELS, validateAttendance } from '../../utils/employeeAccounting';
import { generateId } from '../../utils/id';

interface RecordAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAttendance: (record: AttendanceRecord) => Promise<{ success: boolean; error?: string }>;
  employees: Employee[];
  initialEmployeeId?: string;
  initialDate?: string;
  existingRecords?: AttendanceRecord[];
}

export const RecordAttendanceModal = ({
  isOpen,
  onClose,
  onSaveAttendance,
  employees,
  initialEmployeeId,
  initialDate,
  existingRecords = [],
}: RecordAttendanceModalProps) => {
  const activeEmployees = employees.filter((e) => !e.isArchived);
  const defaultEmpId = initialEmployeeId || (activeEmployees.length > 0 ? activeEmployees[0].id : '');
  
  const [selectedEmpId, setSelectedEmpId] = useState(defaultEmpId);
  const [date, setDate] = useState(initialDate || '2026-10-10');
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [arrivalTime, setArrivalTime] = useState('০৬:৩০');
  const [departureTime, setDepartureTime] = useState('১৮:০০');
  const [notes, setNotes] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentEmployee = employees.find((e) => e.id === selectedEmpId);
  const existingForDate = existingRecords.find(
    (r) => r.employeeId === selectedEmpId && (r.date === date || r.date.includes(date))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');

    const record: AttendanceRecord = {
      id: existingForDate ? existingForDate.id : generateId('att'),
      employeeId: selectedEmpId,
      employeeName: currentEmployee?.name,
      date,
      status,
      statusBn: ATTENDANCE_STATUS_LABELS[status].bn,
      arrivalTime: status === 'present' ? arrivalTime : undefined,
      departureTime: status === 'present' ? departureTime : undefined,
      notes: notes.trim() || undefined,
    };

    const validation = validateAttendance(record);
    if (!validation.isValid) {
      setErrorBanner(validation.error || 'ফর্মের তথ্য সঠিক নয়।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSaveAttendance(record);
      if (!res.success) {
        setErrorBanner(res.error || 'হাজিরা সংরক্ষণ ব্যর্থ হয়েছে।');
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
              <Calendar className="w-5 h-5 text-[#16402C]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#16402C]">কর্মীর দৈনিক হাজিরা</h3>
              <p className="text-xs text-gray-500 mt-0.5">আজকের উপস্থিতি ও কাজের সময় লিখে রাখুন</p>
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

          {existingForDate && (
            <div className="p-3 bg-[#FAF7F0] border border-[#EAE2D0] rounded-2xl text-xs text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E5B842] shrink-0" />
              <span>এই তারিখে ইতিমধ্যে <strong>{existingForDate.statusBn}</strong> এন্ট্রি রয়েছে। সংরক্ষণ করলে হালনাগাদ হবে।</span>
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              কর্মী নির্বাচন করুন <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-gray-900"
              required
            >
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.role}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              হাজিরার তারিখ <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium"
              required
            />
          </div>

          {/* Attendance Status Radios */}
          <div>
            <label className="block font-bold text-gray-700 mb-2">
              আজকের অবস্থা <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('present')}
                className={`py-3 px-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  status === 'present'
                    ? 'bg-[#EAF5EE] border-[#2A7A50] text-[#1B4D35] font-bold shadow-xs'
                    : 'bg-[#FAF7F0]/60 border-[#EAE2D0] text-gray-700 hover:bg-white'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${status === 'present' ? 'text-[#2A7A50]' : 'text-gray-400'}`} />
                <span className="text-xs">উপস্থিত</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('absent')}
                className={`py-3 px-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  status === 'absent'
                    ? 'bg-[#FEF2F2] border-[#DC2626] text-[#991B1B] font-bold shadow-xs'
                    : 'bg-[#FAF7F0]/60 border-[#EAE2D0] text-gray-700 hover:bg-white'
                }`}
              >
                <XCircle className={`w-5 h-5 ${status === 'absent' ? 'text-[#DC2626]' : 'text-gray-400'}`} />
                <span className="text-xs">অনুপস্থিত</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('leave')}
                className={`py-3 px-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                  status === 'leave'
                    ? 'bg-[#FFFBEB] border-[#D97706] text-[#92400E] font-bold shadow-xs'
                    : 'bg-[#FAF7F0]/60 border-[#EAE2D0] text-gray-700 hover:bg-white'
                }`}
              >
                <Clock className={`w-5 h-5 ${status === 'leave' ? 'text-[#D97706]' : 'text-gray-400'}`} />
                <span className="text-xs">ছুটি</span>
              </button>
            </div>
          </div>

          {/* Times (Only if Present) */}
          {status === 'present' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF7F0]/60 rounded-2xl border border-[#EAE2D0]">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  কাজে আসার সময়
                </label>
                <input
                  type="text"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  placeholder="যেমন: ০৬:৩০"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE2D0] bg-white text-xs outline-hidden focus:border-[#16402C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  ছুটির সময়
                </label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  placeholder="যেমন: ১৮:০০"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE2D0] bg-white text-xs outline-hidden focus:border-[#16402C]"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>মন্তব্য (ঐচ্ছিক)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="যেমন: সময়মতো গরু দোয়ানো সম্পন্ন করেছে"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 text-xs"
            />
          </div>

          {/* Action Buttons */}
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
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'হাজিরা সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
