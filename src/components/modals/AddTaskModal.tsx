import { useState, type FormEvent } from 'react';
import { X, CalendarClock, AlertCircle } from 'lucide-react';
import type { ReminderTask, Employee } from '../../types/farm';
import { generateId } from '../../utils/id';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: ReminderTask) => Promise<{ success: boolean; error?: string } | void> | void;
  employees?: Employee[];
  initialEmployeeId?: string;
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
}: AddTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('১২ অক্টোবর ২০২৬');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [category, setCategory] = useState<'vaccine' | 'feed' | 'vet' | 'worker' | 'biogas' | 'other'>('worker');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(initialEmployeeId || '');
  const [assignedTo, setAssignedTo] = useState(
    initialEmployeeId && employees.length > 0 
      ? (employees.find(e => e.id === initialEmployeeId)?.name || 'মো: রহিম উদ্দিন') 
      : 'মো: রহিম উদ্দিন'
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectTemplate = (template: { title: string; category: any }) => {
    setTitle(template.title);
    setCategory(template.category);
  };

  const handleWorkerChange = (empId: string) => {
    setAssignedEmployeeId(empId);
    const emp = employees.find((e) => e.id === empId);
    if (emp) {
      setAssignedTo(emp.name);
    } else if (empId === 'owner') {
      setAssignedTo('মো: মোমিনুল ইসলাম (মালিক)');
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
              <h2 className="text-lg md:text-xl font-bold">নতুন কাজ বা অনুস্মারক যোগ করুন</h2>
              <p className="text-xs text-white/80 mt-0.5">খামারের দৈনন্দিন রুটিন ও স্বাস্থ্য পরীক্ষা ট্র্যাকিং</p>
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
              দ্রুত কাজের টেমপ্লেট নির্বাচন করুন (ঐচ্ছিক):
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
              কাজের শিরোনাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="যেমন: খুরারোগের দ্বিতীয় ডোজ টিকা, ভুসি ক্রয়"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] focus:ring-1 focus:ring-[#16402C] outline-hidden text-sm"
              required
            />
          </div>

          {/* Due date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                শেষ সময় / তারিখ *
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                বিভাগ / ক্যাটাগরি *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              >
                <option value="worker">শ্রমিক দায়িত্ব ও পরিচ্ছন্নতা</option>
                <option value="biogas">বায়োগ্যাস প্ল্যান্ট কাজ (Biogas)</option>
                <option value="feed">পশুখাদ্য ক্রয় ও সংগ্রহ (Feed)</option>
                <option value="vaccine">টিকা ও ইনজেকশন (Vaccine)</option>
                <option value="vet">ডাক্তার ভিজিট ও চেকআপ (Vet)</option>
                <option value="other">অন্যান্য কাজ</option>
              </select>
            </div>
          </div>

          {/* Priority & Assigned To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                অগ্রাধিকার (Priority) *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white"
              >
                <option value="high">জরুরি (High Priority)</option>
                <option value="medium">মাঝারি (Medium)</option>
                <option value="low">সাধারণ (Low)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                দায়িত্বপ্রাপ্ত কর্মী *
              </label>
              <select
                value={assignedEmployeeId || assignedTo}
                onChange={(e) => handleWorkerChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#16402C] outline-hidden text-sm bg-white font-medium"
              >
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="মো: রহিম উদ্দিন">মো: রহিম উদ্দিন (প্রধান গোয়ালা)</option>
                    <option value="করিম হাসান">করিম হাসান (বায়োগ্যাস ইনচার্জ)</option>
                  </>
                )}
                <option value="owner">মো: মোমিনুল ইসলাম (মালিক)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              বিস্তারিত বিবরণ (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="কাজের বিস্তারিত নির্দেশ বা নোট..."
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
              {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'কাজ সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
