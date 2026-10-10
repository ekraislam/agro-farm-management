import { useState, useMemo } from 'react';
import { 
  CalendarClock, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Search,
  RotateCcw,
  Tag,
  User,
  Activity,
  Flame,
  Wheat,
  Syringe,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { 
  ReminderTask, 
  Employee, 
  Cow, 
  HealthRecord, 
  BiogasInspectionItem 
} from '../../types/farm';
import { 
  categorizeRemindersByUrgency, 
  consolidateFarmReminders 
} from '../../utils/healthAccounting';
import { formatBanglaDate } from '../../utils/accounting';
import { AddTaskModal } from '../modals/AddTaskModal';

interface RemindersViewProps {
  reminders: ReminderTask[];
  employees?: Employee[];
  cows?: Cow[];
  healthRecords?: HealthRecord[];
  biogasInspections?: BiogasInspectionItem[];
  onOpenAddTask: () => void;
  onToggleTask: (taskId: string, completionDate?: string) => void;
  onUpdateTask?: (task: ReminderTask) => Promise<{ success: boolean; error?: string } | void> | void;
  onDeleteTask?: (taskId: string) => Promise<{ success: boolean; error?: string } | void> | void;
  ownerName?: string;
}

type ReminderTab = 'all' | 'overdue' | 'dueToday' | 'dueSoon' | 'upcoming' | 'completed';
type PriorityFilter = 'all' | 'high' | 'medium' | 'low';
type CategoryFilter = 'all' | 'vaccine' | 'feed' | 'vet' | 'worker' | 'biogas' | 'medicine' | 'other';

export const RemindersView = ({
  reminders = [],
  employees = [],
  cows = [],
  healthRecords = [],
  biogasInspections = [],
  onOpenAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  ownerName = 'মুমিনুল ইসলাম',
}: RemindersViewProps) => {
  const [activeTab, setActiveTab] = useState<ReminderTab>('all');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>('all');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<PriorityFilter>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingTask, setEditingTask] = useState<ReminderTask | null>(null);
  const [showCompletedInAll, setShowCompletedInAll] = useState<boolean>(false);

  // Intelligently consolidate manual tasks, health booster/deworming follow-ups, and biogas inspections
  const consolidatedTasks = useMemo(() => {
    return consolidateFarmReminders({
      tasks: reminders,
      healthRecords,
      biogasInspections,
      cows,
      employees,
    });
  }, [reminders, healthRecords, biogasInspections, cows, employees]);

  const categories = useMemo(() => categorizeRemindersByUrgency(consolidatedTasks), [consolidatedTasks]);
  const { overdue, dueToday, dueSoon, completed, allUpcoming } = categories;

  const filteredTasks = useMemo(() => {
    let list: ReminderTask[];
    switch (activeTab) {
      case 'overdue':
        list = overdue;
        break;
      case 'dueToday':
        list = dueToday;
        break;
      case 'dueSoon':
        list = dueSoon;
        break;
      case 'upcoming':
        list = allUpcoming;
        break;
      case 'completed':
        list = completed;
        break;
      case 'all':
      default:
        list = consolidatedTasks;
        break;
    }

    // Filter by Worker
    if (selectedWorkerFilter !== 'all') {
      list = list.filter(
        (t) => t.assignedEmployeeId === selectedWorkerFilter || t.assignedTo === selectedWorkerFilter
      );
    }

    // Filter by Priority
    if (selectedPriorityFilter !== 'all') {
      list = list.filter((t) => t.priority === selectedPriorityFilter);
    }

    // Filter by Category
    if (selectedCategoryFilter !== 'all') {
      list = list.filter((t) => t.category === selectedCategoryFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const workerMatch = (t.assignedTo || '').toLowerCase().includes(q);
        const cowMatch = t.cowId
          ? cows.some(
              (c) =>
                c.id === t.cowId &&
                (c.tagNumber.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
            )
          : false;
        return titleMatch || descMatch || workerMatch || cowMatch;
      });
    }

    return list;
  }, [
    activeTab, 
    consolidatedTasks, 
    overdue, 
    dueToday, 
    dueSoon, 
    allUpcoming, 
    completed, 
    selectedWorkerFilter, 
    selectedPriorityFilter, 
    selectedCategoryFilter, 
    searchQuery, 
    cows
  ]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vaccine':
      case 'medicine':
        return <Syringe className="w-3.5 h-3.5 text-blue-600" />;
      case 'feed':
        return <Wheat className="w-3.5 h-3.5 text-amber-600" />;
      case 'biogas':
        return <Flame className="w-3.5 h-3.5 text-emerald-600" />;
      case 'vet':
        return <Activity className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Tag className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getCategoryLabelBn = (cat: string) => {
    switch (cat) {
      case 'vaccine': return 'টিকা';
      case 'feed': return 'খাদ্য';
      case 'biogas': return 'বায়োগ্যাস';
      case 'vet': return 'ডাক্তার';
      case 'medicine': return 'ঔষধ';
      default: return 'সাধারণ';
    }
  };

  const renderTaskCard = (task: ReminderTask) => {
    const isDone = task.completed;
    const isHigh = task.priority === 'high';
    const isOverdue = !isDone && overdue.some((o) => o.id === task.id);
    const isToday = !isDone && dueToday.some((d) => d.id === task.id);
    const relatedCow = task.cowId ? cows.find((c) => c.id === task.cowId) : null;

    return (
      <div
        key={task.id}
        onClick={() => setEditingTask(task)}
        className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 select-none group ${
          isDone
            ? 'bg-gray-50/80 border-gray-200 opacity-75 hover:opacity-100'
            : isOverdue
            ? 'bg-red-50/50 border-red-200 hover:border-red-400 shadow-xs'
            : isToday
            ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400 shadow-xs'
            : 'bg-white border-[#EAE2D0] hover:border-[#16402C]/40 shadow-xs'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTask(task.id);
            }}
            className="mt-0.5 text-gray-400 hover:text-[#2A7A50] transition-colors cursor-pointer"
            title={isDone ? 'কাজটি পুনরায় পেন্ডিং তালিকায় আনুন' : 'কাজটি সম্পন্ন হিসেবে চিহ্নিত করুন'}
          >
            {isDone ? (
              <CheckCircle2 className="w-6 h-6 text-[#2A7A50]" />
            ) : (
              <Circle className="w-6 h-6" />
            )}
          </button>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`text-sm md:text-base font-bold ${
                  isDone ? 'line-through text-gray-400' : 'text-gray-900'
                }`}
              >
                {task.title}
              </h3>

              {/* Priority Badge */}
              <span
                className={`text-[10px] md:text-xs px-2 py-0.5 rounded-md font-bold ${
                  isHigh
                    ? 'bg-[#FDF2F2] text-[#9E2A2B] border border-[#F8C8C8]'
                    : task.priority === 'medium'
                    ? 'bg-[#FEF9E7] text-[#936709] border border-[#F7E2A9]'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {task.priorityBn}
              </span>

              {/* Category Icon Badge */}
              <span className="flex items-center gap-1 text-[10px] md:text-xs px-2 py-0.5 rounded-md bg-[#FAF7F0] border border-[#EAE2D0] text-gray-700">
                {getCategoryIcon(task.category)}
                <span>{getCategoryLabelBn(task.category)}</span>
              </span>

              {/* Cow Badge if linked */}
              {relatedCow && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                  গাভী: {relatedCow.tagNumber} ({relatedCow.name})
                </span>
              )}

              {/* Urgency Badge */}
              {isOverdue && (
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-red-100 text-red-800 border border-red-300">
                  মেয়াদোত্তীর্ণ
                </span>
              )}
              {isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  আজকের করণীয়
                </span>
              )}
            </div>

            {task.description && (
              <p className={`text-xs md:text-sm ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-gray-500 pt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                নির্ধারিত তারিখ: <strong>{formatBanglaDate(task.dueDate)}</strong>
              </span>
              {task.completedAt && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-medium">
                    সম্পন্ন হয়েছে: {formatBanglaDate(task.completedAt)}
                  </span>
                </>
              )}
              <span>•</span>
              <span>দায়িত্বপ্রাপ্ত: <strong>{task.assignedTo || 'খামার কর্মী'}</strong></span>
            </div>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="shrink-0 text-right space-y-1.5 flex flex-col items-end">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-xl inline-block ${
              isDone
                ? 'bg-gray-200 text-gray-700'
                : isOverdue
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0]'
            }`}
          >
            {isDone ? 'সম্পন্ন' : isOverdue ? 'দেরি হয়েছে' : 'চলমান'}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask(task);
              }}
              className="px-2.5 py-1 rounded-xl border border-gray-200 hover:border-[#16402C] hover:bg-[#FAF7F0] text-gray-700 hover:text-[#16402C] transition-all flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="কাজের তথ্য বা কর্মী সংশোধন করুন"
            >
              <Pencil className="w-3 h-3 text-[#16402C]" />
              <span>সম্পাদনা</span>
            </button>

            {onDeleteTask && (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (window.confirm(`আপনি কি নিশ্চিত যে "${task.title}" কাজটি তালিকা থেকে মুছে ফেলতে চান?`)) {
                    await onDeleteTask(task.id);
                  }
                }}
                className="p-1 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all text-xs cursor-pointer"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isDone && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleTask(task.id);
              }}
              className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-800 underline block cursor-pointer pt-0.5"
              title="পুনরায় সক্রিয় করুন"
            >
              <RotateCcw className="w-3 h-3" />
              <span>পুনরায় চালু</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#C53030]/10 text-[#9E2A2B]">
            <CalendarClock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">
              খামারের জরুরি কাজ ও টিকার তালিকা
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              গরুর টিকা, ডাক্তারের সেবা, ঘাস-ভুসি কেনা এবং খামারের কাজের হিসাব
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddTask}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5 text-[#E5B842]" />
          <span>নতুন কাজ যোগ করুন</span>
        </button>
      </div>

      {/* 5 Distinct Urgency Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden min-w-0 ${
            activeTab === 'overdue'
              ? 'bg-red-100 border-red-300 shadow-xs'
              : 'bg-white border-[#EAE2D0] hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-xs font-bold text-red-700 truncate">দেরি হয়েছে (জরুরি)</span>
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          </div>
          <span className="text-2xl font-black text-red-700 mt-1 block truncate">{overdue.length}</span>
          <span className="text-[10px] text-red-600 mt-0.5 block truncate">দ্রুত ব্যবস্থা নিন</span>
        </div>

        <div
          onClick={() => setActiveTab('dueToday')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden min-w-0 ${
            activeTab === 'dueToday'
              ? 'bg-amber-100 border-amber-300 shadow-xs'
              : 'bg-white border-[#EAE2D0] hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-xs font-bold text-amber-800 truncate">আজকের কাজ</span>
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <span className="text-2xl font-black text-amber-800 mt-1 block truncate">{dueToday.length}</span>
          <span className="text-[10px] text-amber-700 mt-0.5 block truncate">আজই শেষ করুন</span>
        </div>

        <div
          onClick={() => setActiveTab('dueSoon')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden min-w-0 ${
            activeTab === 'dueSoon'
              ? 'bg-emerald-100 border-emerald-300 shadow-xs'
              : 'bg-white border-[#EAE2D0] hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-xs font-bold text-emerald-800 truncate">আগামী ৭ দিন</span>
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <span className="text-2xl font-black text-emerald-800 mt-1 block truncate">{dueSoon.length}</span>
          <span className="text-[10px] text-emerald-700 mt-0.5 block truncate">আসন্ন ৭ দিনের কাজ</span>
        </div>

        <div
          onClick={() => setActiveTab('upcoming')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden min-w-0 ${
            activeTab === 'upcoming'
              ? 'bg-blue-100 border-blue-300 shadow-xs'
              : 'bg-white border-[#EAE2D0] hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-xs font-bold text-blue-800 truncate">ভবিষ্যতের কাজ</span>
            <CalendarClock className="w-4 h-4 text-blue-600 shrink-0" />
          </div>
          <span className="text-2xl font-black text-blue-800 mt-1 block truncate">{allUpcoming.length}</span>
          <span className="text-[10px] text-blue-700 mt-0.5 block truncate">১৫ তারিখ সহ পরবর্তী</span>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden min-w-0 ${
            activeTab === 'completed'
              ? 'bg-gray-100 border-gray-300 shadow-xs'
              : 'bg-white border-[#EAE2D0] hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span className="text-xs font-bold text-gray-700 truncate">শেষ হওয়া কাজ</span>
            <CheckCircle className="w-4 h-4 text-gray-500 shrink-0" />
          </div>
          <span className="text-2xl font-black text-gray-700 mt-1 block truncate">{completed.length}</span>
          <span className="text-[10px] text-gray-500 mt-0.5 block truncate">ইতিমধ্যে সম্পন্ন হয়েছে</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#EAE2D0] shadow-xs space-y-4">
        {/* Urgency Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'all', label: `সব কাজ (${consolidatedTasks.length})` },
            { id: 'overdue', label: `মেয়াদোত্তীর্ণ (${overdue.length})` },
            { id: 'dueToday', label: `আজকের কাজ (${dueToday.length})` },
            { id: 'dueSoon', label: `আগামী ৭ দিন (${dueSoon.length})` },
            { id: 'upcoming', label: `ভবিষ্যতের কাজ (${allUpcoming.length})` },
            { id: 'completed', label: `সম্পন্ন কাজ (${completed.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReminderTab)}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#16402C] text-white shadow-xs'
                  : 'bg-[#FAF7F0] text-gray-700 hover:bg-[#F2ECE1] border border-[#EAE2D0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-[#F2ECE1]">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="কাজের নাম, গাভী বা কর্মী দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-[#FAF7F0] border border-[#EAE2D0] rounded-xl text-xs md:text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#16402C] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value as PriorityFilter)}
              className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EAE2D0] rounded-xl text-xs md:text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#16402C]"
            >
              <option value="all">সকল গুরুত্ব (Priority)</option>
              <option value="high">জরুরি / উচ্চ গুরুত্ব</option>
              <option value="medium">মাঝারি গুরুত্ব</option>
              <option value="low">সাধারণ গুরুত্ব</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value as CategoryFilter)}
              className="w-full px-3 py-2 bg-[#FAF7F0] border border-[#EAE2D0] rounded-xl text-xs md:text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#16402C]"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              <option value="vaccine">টিকা ও স্বাস্থ্য</option>
              <option value="vet">পশুচিকিৎসক</option>
              <option value="feed">পশুখাদ্য ও যত্ন</option>
              <option value="biogas">বায়োগ্যাস প্ল্যান্ট</option>
              <option value="worker">কর্মীর সাধারণ দায়িত্ব</option>
              <option value="medicine">ঔষধ ও চিকিৎসা</option>
              <option value="other">অন্যান্য কাজ</option>
            </select>
          </div>
        </div>

        {/* Worker Assignment Filter Bar */}
        {employees.length > 0 && (
          <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#EAE2D0] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-gray-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#16402C]" />
              <span>দায়িত্বপ্রাপ্ত কর্মী অনুযায়ী ফিল্টার:</span>
            </span>
            <select
              value={selectedWorkerFilter}
              onChange={(e) => setSelectedWorkerFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-[#D5CBB5] bg-white font-bold text-gray-800 outline-hidden focus:ring-2 focus:ring-[#16402C]"
            >
              <option value="all">সকল কর্মীর কাজ</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {activeTab === 'all' ? (
          <>
            {/* Active (Pending) Tasks */}
            {filteredTasks.filter((t) => !t.completed).map((task) => renderTaskCard(task))}

            {filteredTasks.filter((t) => !t.completed).length === 0 && (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#EAE2D0] space-y-2">
                <CheckCircle2 className="w-12 h-12 text-[#2A7A50] mx-auto opacity-80" />
                <h4 className="font-bold text-base text-[#16402C]">চমৎকার! কোনো বকেয়া কাজ অবশিষ্ট নেই</h4>
                <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto">
                  এই মুহূর্তের সকল কাজ সম্পন্ন হয়েছে। আপনার খামারের সকল কার্যক্রম সুষ্ঠুভাবে চলমান রয়েছে।
                </p>
              </div>
            )}

            {/* Collapsible Completed Tasks Section to keep view uncluttered */}
            {filteredTasks.filter((t) => t.completed).length > 0 && (
              <div className="mt-6 border border-[#EAE2D0] rounded-3xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowCompletedInAll(!showCompletedInAll)}
                  className="w-full p-4 md:p-5 bg-[#FAF7F0] hover:bg-[#F2ECE1] transition-colors flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        সম্পন্ন হওয়া কাজের খতিয়ান ({filteredTasks.filter((t) => t.completed).length}টি)
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        মূল তালিকা পরিচ্ছন্ন ও হালকা রাখতে সম্পন্ন কাজগুলো ভাঁজ করে রাখা হয়েছে
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#16402C] bg-white px-3.5 py-1.5 rounded-xl border border-[#EAE2D0] shadow-2xs flex items-center gap-1.5">
                      {showCompletedInAll ? (
                        <><span>লুকান</span> <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <><span>তালিকা দেখুন ({filteredTasks.filter((t) => t.completed).length})</span> <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </span>
                  </div>
                </button>

                {showCompletedInAll && (
                  <div className="p-4 md:p-5 space-y-3 bg-[#FCFBF8] border-t border-[#EAE2D0]">
                    {filteredTasks.filter((t) => t.completed).map((task) => renderTaskCard(task))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {filteredTasks.map((task) => renderTaskCard(task))}

            {filteredTasks.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE2D0] space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto opacity-70" />
                <h4 className="font-bold text-base text-[#16402C]">কোনো কাজ অবশিষ্ট নেই!</h4>
                <p className="text-xs md:text-sm text-gray-500 max-w-md mx-auto">
                  নির্বাচিত ফিল্টার বা ক্যাটাগরিতে এই মুহূর্তে কোনো কাজ পাওয়া যায়নি। আপনি নতুন কাজ যোগ করতে পারেন।
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Task Edit Modal for reassigning, editing due date, priority or deleting */}
      {editingTask && (
        <AddTaskModal
          isOpen={Boolean(editingTask)}
          initialTask={editingTask}
          onClose={() => setEditingTask(null)}
          onAddTask={async () => {}}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          employees={employees}
          ownerName={ownerName}
        />
      )}
    </div>
  );
};
