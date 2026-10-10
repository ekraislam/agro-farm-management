import { useState, useEffect, type FormEvent } from 'react';
import { X, CalendarClock, AlertCircle } from 'lucide-react';
import type { ReminderTask, Employee } from '../../types/farm';
import { generateId } from '../../utils/id';
import { toIsoDateString, formatBanglaDate } from '../../utils/accounting';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: ReminderTask) => Promise<{ success: boolean; error?: string } | void> | void;
  employees?: Employee[];
  initialEmployeeId?: string;
  ownerName?: string;
}

const QUICK_TASK_TEMPLATES = [
  { title: 'সকাল ও বিকালে গরু দোয়ানো', category: 'worker' as const },
  { title: 'গাভী ধোয়ানো ও গোয়ালঘর পরিচ্ছন্নতা', category: 'worker' as const },
  { title: 'প্রতিদিন গোবর সংগ্রহ ও বায়োগ্যাসে লোডিং', category: 'biogas' as const },
  { title: 'বায়োগ্যাস পাইপ ও সেফটি ভালভ পরীক্ষা', category: 'biogas' as const },
  { title: 'গমের ভুসি ও খৈল স্টক পরীক্ষা ও ক্রয়', category: 'feed' as const },
];

export const AddTaskModal = ({
  isOpen,
  onClose,
  onAddTask,
  employees = [],
  initialEmployeeId,
  ownerName = 'মুমিনুল ইসলাম',
}: AddTaskModalProps) => {
  const activeEmployees = employees.filter((e) => !e.isArchived && e.status === 'active');
  const farmOwner = `${ownerName} (মালিক)`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pickerDate, setPickerDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toIsoDateString(d);
  });
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatBanglaDate(d);
  });
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [category, setCategory] = useState<'vaccine' | 'feed' | 'vet' | 'worker' | 'biogas' | 'other'>('worker');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(
    initialEmployeeId || (activeEmployees.length > 0 ? activeEmployees[0].id : 'owner')
  );
  const [assignedTo, setAssignedTo] = useState(
    initialEmployeeId
      ? (activeEmployees.find((e) => e.id === initialEmployeeId)?.name || farmOwner)
      : (activeEmployees.length > 0 ? activeEmployees[0].name : farmOwner)
  );

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync worker selection whenever modal opens or employee list updates
  useEffect(() => {
    if (isOpen) {
      const targetEmpId = initialEmployeeId || (activeEmployees.length > 0 ? activeEmployees[0].id : 'owner');
      setAssignedEmployeeId(targetEmpId);
      if (targetEmpId === 'owner') {
        setAssignedTo(farmOwner);
      } else {
        const emp = activeEmployees.find((e) => e.id === targetEmpId);
        setAssignedTo(emp ? emp.name : farmOwner);
      }
    }
  }, [isOpen, initialEmployeeId, employees]);

  if (!isOpen) return null;


  const handleSelectTemplate = (template: { title: string; category: any }) => {
    setTitle(template.title);
    setCategory(template.category);
  };

  const handleWorkerChange = (empId: string) => {
    setAssignedEmployeeId(empId);
    const emp = activeEmployees.find((e) => e.id === empId);
    if (emp) {
      setAssignedTo(emp.name);
    } else if (empId === 'owner') {
      setAssignedTo(farmOwner);
    } else {
      setAssignedTo(empId);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('অনুগ্রহ করে কাজের নাম বা বিষয় লিখুন');
      return;
    }

    const priorityBnMap = {
      high: 'জরুরি',
      medium: 'মাঝারি',
      low: 'সাধারণ',
    };

    const newTask: ReminderTask = {
      id: generateId('rem'),
      title: title.trim(),
      description: description.trim() || 'নির্ধারিত সময়ে সম্পন্ন করতে হবে',
      dueDate,
      priority,
      priorityBn: priorityBnMap[priority],
      category,
      completed: false,
      assignedEmployeeId: assignedEmployeeId || undefined,
      assignedTo,
    };

    setIsSubmitting(true);
    try {
      const result = await onAddTask(newTask);
      setIsSubmitting(false);
      if (result && !result.success) {
        setError(result.error || 'কাজ ক্লাউডে সংরক্ষণ করা সম্ভব হয়নি।');
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
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">নতুন জরুরি কাজ যোগ করুন</h2>
              <p className="text-xs text-white/80 mt-0.5">খামারের দৈনন্দিন কাজকর্ম ও তদারকির তালিকা</p>
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

          {/* Quick Task Template Pills */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              কাজের তালিকা থেকে বেছে নিন (ঐচ্ছিক):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TASK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="px-2.5 py-1 rounded-lg bg-[#FAF7F0] border border-[#EAE2D0] hover:bg-[#F2ECE1] text-[11px] font-semibold text-[#16402C] transition-colors"
                >
                  + {tmpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              কাজের নাম বা বিষয় *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="যেমন: খুরারোগের দ্বিতীয় ডোজ টিকা, ভুসি কেনা"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm"
              required
            />
          </div>

          {/* Due date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                কবে করতে হবে (তারিখ) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={pickerDate}
                  onChange={(e) => {
                    const iso = e.target.value;
                    setPickerDate(iso);
                    if (iso) {
                      setDueDate(formatBanglaDate(iso));
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white cursor-pointer shrink-0"
                  required
                />
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    const parsedIso = toIsoDateString(e.target.value);
                    setPickerDate(parsedIso);
                  }}
                  placeholder="যেমন: ১৫ অক্টোবর ২০২৬"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm font-semibold text-gray-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                কাজের ধরন *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              >
                <option value="worker">গোয়ালঘর ও খামার কাজ</option>
                <option value="biogas">বায়োগ্যাস প্ল্যান্টের কাজ</option>
                <option value="feed">খাবার ও ভুসি কেনা</option>
                <option value="vaccine">টিকা ও কৃমিনাশক</option>
                <option value="vet">ডাক্তার দেখানো ও চিকিৎসা</option>
                <option value="other">অন্যান্য কাজ</option>
              </select>
            </div>
          </div>

          {/* Priority & Assigned To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                কাজের গুরুত্ব *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              >
                <option value="high">খুব জরুরি (আজই করণীয়)</option>
                <option value="medium">মাঝারি (কয়েকদিনের মধ্যে)</option>
                <option value="low">সাধারণ (সময়মতো করলেই হবে)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                কে এই কাজ করবেন *
              </label>
              <select
                value={assignedEmployeeId || assignedTo}
                onChange={(e) => handleWorkerChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white font-medium"
              >
                <option value="owner">{farmOwner}</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              অতিরিক্ত তথ্য বা নোট (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="কাজের বিস্তারিত কোনো নির্দেশ থাকলে লিখুন..."
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
                <CalendarClock className="w-4 h-4 text-[#E5B842]" />
              )}
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'কাজের তালিকায় যোগ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
