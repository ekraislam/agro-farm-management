import { useState } from 'react';
import { 
  Users, 
  X, 
  Wallet, 
  Phone, 
  Calendar, 
  Briefcase, 
  FileText, 
  CheckSquare, 
  AlertCircle,
  Plus
} from 'lucide-react';
import type { Employee, EmployeeStatus } from '../../types/farm';
import { validateEmployee } from '../../utils/employeeAccounting';
import { generateId } from '../../utils/id';
import { parseCurrency } from '../../utils/accounting';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => Promise<{ success: boolean; error?: string }>;
  existingEmployees: Employee[];
  initialEmployee?: Employee | null;
}

const COMMON_DUTIES = [
  'সকাল ও বিকালে গরু দোয়ানো',
  'গাভী ধোয়ানো ও গোয়ালঘর পরিচ্ছন্নতা',
  'পশুখাদ্য প্রস্তুতকরণ ও সঠিক সময়ে বিতরণ',
  'গোবর সংগ্রহ ও বায়োগ্যাস প্ল্যান্টে লোডিং',
  'বায়োগ্যাসের চাপ ও সেফটি ভালভ পরীক্ষা',
  'জৈব সার (স্লারি) শুকানো ও বস্তাবন্দী করা',
  'গাভীর অসুস্থতা বা আচরণ পরিবর্তন পর্যবেক্ষণ',
];

export const AddEmployeeModal = ({
  isOpen,
  onClose,
  onSave,
  existingEmployees,
  initialEmployee,
}: AddEmployeeModalProps) => {
  const [name, setName] = useState(initialEmployee?.name || '');
  const [role, setRole] = useState(initialEmployee?.role || 'গোয়ালা ও পরিচর্যাকারী');
  const [phone, setPhone] = useState(initialEmployee?.phone || '');
  const [salaryMonthly, setSalaryMonthly] = useState(initialEmployee ? String(initialEmployee.salaryMonthly) : '10000');
  const [joiningDate, setJoiningDate] = useState(initialEmployee?.joiningDate || '২০২৬-০১-০১');
  const [status, setStatus] = useState<EmployeeStatus>(initialEmployee?.status || 'active');
  const [assignedDuties, setAssignedDuties] = useState<string[]>(initialEmployee?.assignedDuties || [
    'সকাল ও বিকালে গরু দোয়ানো',
    'গোয়ালঘর পরিচ্ছন্নতা',
  ]);
  const [customDuty, setCustomDuty] = useState('');
  const [notes, setNotes] = useState(initialEmployee?.notes || '');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [errorBanner, setErrorBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleToggleDuty = (duty: string) => {
    if (assignedDuties.includes(duty)) {
      setAssignedDuties(assignedDuties.filter((d) => d !== duty));
    } else {
      setAssignedDuties([...assignedDuties, duty]);
    }
  };

  const handleAddCustomDuty = () => {
    if (!customDuty.trim()) return;
    if (!assignedDuties.includes(customDuty.trim())) {
      setAssignedDuties([...assignedDuties, customDuty.trim()]);
    }
    setCustomDuty('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');

    const salaryNum = parseCurrency(salaryMonthly);

    const empData: Partial<Employee> = {
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      salaryMonthly: salaryNum,
      joiningDate: joiningDate.trim(),
      status,
      assignedDuties,
      notes: notes.trim(),
    };

    const validation = validateEmployee(empData, existingEmployees, initialEmployee?.id);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setErrorBanner('অনুগ্রহ করে ফর্মের লাল চিহ্নিত ভুলগুলো সংশোধন করুন।');
      return;
    }

    setIsSubmitting(true);
    const employeeToSave: Employee = {
      id: initialEmployee ? initialEmployee.id : generateId('emp'),
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      salaryMonthly: salaryNum,
      joiningDate: joiningDate.trim(),
      assignedDuties,
      status,
      avatarInitials: name.trim().slice(0, 2),
      notes: notes.trim() || undefined,
      isArchived: initialEmployee?.isArchived || false,
      archivedAt: initialEmployee?.archivedAt,
    };

    try {
      const res = await onSave(employeeToSave);
      if (!res.success) {
        setErrorBanner(res.error || 'কর্মচারী সংরক্ষণ করতে ব্যর্থ হয়েছে।');
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
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col border border-[#E8DFC9] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-[#F2ECE1] flex items-center justify-between bg-[#FAF7F0]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#16402C]/10 text-[#16402C]">
              <Users className="w-5 h-5 text-[#16402C]" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-[#16402C]">
                {initialEmployee ? 'কর্মীর তথ্য পরিবর্তন' : 'নতুন কর্মী যোগ করুন'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                খামারের কর্মী, মাসিক বেতন ও কাজের দায়িত্ব
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 md:p-6 space-y-4 text-xs md:text-sm">
          {errorBanner && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-center gap-2 text-xs text-[#991B1B]">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{errorBanner}</span>
            </div>
          )}

          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                কর্মীর নাম <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="যেমন: মো: রহিম উদ্দিন"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  formErrors.name ? 'border-red-400 bg-red-50/30' : 'border-[#EAE2D0]'
                } outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium`}
                required
              />
              {formErrors.name && <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                কাজের পদবী বা ভূমিকা <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setFormErrors((prev) => ({ ...prev, role: '' }));
                  }}
                  placeholder="যেমন: প্রধান গোয়ালা ও পরিচর্যাকারী"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                    formErrors.role ? 'border-red-400' : 'border-[#EAE2D0]'
                  } outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium`}
                  required
                />
              </div>
              {formErrors.role && <p className="text-[11px] text-red-600 mt-1">{formErrors.role}</p>}
            </div>
          </div>

          {/* Phone & Monthly Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                মোবাইল নম্বর (ঐচ্ছিক)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: ০১৭XXXXXXXX"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                মাসিক বেতন (টাকা) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={salaryMonthly}
                  onChange={(e) => {
                    setSalaryMonthly(e.target.value);
                    setFormErrors((prev) => ({ ...prev, salaryMonthly: '' }));
                  }}
                  placeholder="যেমন: ১৫,০০০"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                    formErrors.salaryMonthly ? 'border-red-400' : 'border-[#EAE2D0]'
                  } outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-bold text-[#16402C]`}
                  required
                />
              </div>
              {formErrors.salaryMonthly && (
                <p className="text-[11px] text-red-600 mt-1">{formErrors.salaryMonthly}</p>
              )}
            </div>
          </div>

          {/* Joining Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                যোগদানের তারিখ
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  placeholder="যেমন: ০১ জানুয়ারি ২০২৪"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                কাজের অবস্থা
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40 font-medium"
              >
                <option value="active">কাজে সক্রিয় (নিয়মিত কর্মরত)</option>
                <option value="on_leave">ছুটিতে আছেন</option>
                <option value="inactive">সাবেক কর্মী (বর্তমানে নেই)</option>
              </select>
            </div>
          </div>

          {/* Assigned Duties Selection */}
          <div className="pt-2 border-t border-[#F2ECE1]">
            <label className="block font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>দৈনিক কাজের দায়িত্বসমূহ:</span>
              <span className="text-[11px] font-normal text-gray-500">
                নির্বাচিত: {assignedDuties.length}টি
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-[#FAF7F0]/50 rounded-2xl border border-[#EAE2D0]">
              {COMMON_DUTIES.map((duty) => {
                const isSelected = assignedDuties.includes(duty);
                return (
                  <button
                    key={duty}
                    type="button"
                    onClick={() => handleToggleDuty(duty)}
                    className={`p-2 rounded-xl text-left flex items-start gap-2 transition-all ${
                      isSelected
                        ? 'bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0] font-semibold'
                        : 'bg-white text-gray-700 border border-[#EAE2D0] hover:bg-gray-50'
                    }`}
                  >
                    <CheckSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-[#2A7A50]' : 'text-gray-300'}`} />
                    <span className="text-xs leading-snug">{duty}</span>
                  </button>
                );
              })}
            </div>

            {/* Add Custom Duty */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customDuty}
                onChange={(e) => setCustomDuty(e.target.value)}
                placeholder="নতুন দায়িত্ব লিখুন..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-[#EAE2D0] text-xs outline-hidden focus:border-[#16402C]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDuty();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomDuty}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F0] border border-[#EAE2D0] text-[#16402C] font-bold text-xs flex items-center gap-1 hover:bg-[#F2ECE1]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>যোগ</span>
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>মন্তব্য বা অন্যান্য তথ্য (ঐচ্ছিক)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="কর্মীর পরিচয়পত্র, জরুরি যোগাযোগের ঠিকানা বা বিশেষ কোনো নোট..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE2D0] outline-hidden focus:border-[#16402C] bg-[#FAF7F0]/40"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-[#EAE2D0] text-gray-700 font-semibold hover:bg-gray-50 active:scale-95 transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold shadow-xs active:scale-95 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>সংরক্ষণ হচ্ছে...</span>
              ) : (
                <span>{initialEmployee ? 'তথ্য হালনাগাদ করুন' : 'কর্মী যোগ করুন'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
