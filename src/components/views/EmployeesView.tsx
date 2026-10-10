import { formatCurrency } from '../../utils/accounting';
import { useState } from 'react';
import { 
  Users, 
  Phone, 
  CheckCircle2, 
  Wallet, 
  Search, 
  Plus, 
  Calendar, 
  UserPlus
} from 'lucide-react';
import type { 
  Employee, 
  AttendanceRecord, 
  FinancialRecord, 
  ReminderTask 
} from '../../types/farm';
import { EmployeeProfileModal } from '../modals/EmployeeProfileModal';
import { calculatePayrollStatus } from '../../utils/employeeAccounting';

interface EmployeesViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  financialRecords: FinancialRecord[];
  tasks: ReminderTask[];
  onOpenAddEmployee: () => void;
  onOpenEditEmployee: (emp: Employee) => void;
  onOpenRecordAttendance: (empId?: string) => void;
  onOpenRecordSalaryPayment: (empId?: string) => void;
  onOpenAddTask: (empId?: string) => void;
  onDeleteOrArchiveEmployee: (empId: string) => void;
  onToggleTask: (taskId: string) => void;
}

const TODAY_ISO = '2026-10-10';
const CURRENT_PERIOD = '2026-10';

export const EmployeesView = ({
  employees,
  attendanceRecords,
  financialRecords,
  tasks,
  onOpenAddEmployee,
  onOpenEditEmployee,
  onOpenRecordAttendance,
  onOpenRecordSalaryPayment,
  onOpenAddTask,
  onDeleteOrArchiveEmployee,
  onToggleTask,
}: EmployeesViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'on_leave' | 'inactive' | 'archived'>('all');
  const [selectedProfileEmployee, setSelectedProfileEmployee] = useState<Employee | null>(null);

  // Metrics
  const activeEmployees = employees.filter((e) => !e.isArchived && e.status === 'active');
  const totalSalaryBudget = activeEmployees.reduce((sum, e) => sum + e.salaryMonthly, 0);

  // Today's attendance counts
  const todayAttendances = attendanceRecords.filter(
    (r) => r.date === TODAY_ISO || r.date.includes('১০ অক্টোবর ২০২৬')
  );
  const todayPresentCount = todayAttendances.filter((r) => r.status === 'present').length;

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    // Search query
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    // Status tabs
    if (statusFilter === 'archived') return emp.isArchived;
    if (emp.isArchived) return false; // don't show archived in other tabs

    if (statusFilter === 'all') return true;
    return emp.status === statusFilter;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#16402C]/10 text-[#16402C]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">খামারের কর্মী ও কাজের দায়িত্ব</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              গোয়ালা ও কর্মীদের হাজিরা, কাজের দায়িত্ব এবং মাসিক বেতনের খাতা
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenRecordAttendance()}
            className="px-4 py-2.5 rounded-2xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-bold text-xs md:text-sm border border-[#EAE2D0] shadow-xs flex items-center gap-2 active:scale-95 transition-all"
          >
            <Calendar className="w-4 h-4 text-[#2A7A50]" />
            <span>আজকের হাজিরা তুলুন</span>
          </button>

          <button
            onClick={onOpenAddEmployee}
            className="px-5 py-2.5 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs md:text-sm shadow-xs flex items-center gap-2 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4 text-[#E5B842]" />
            <span>নতুন কর্মী যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block">খামারের কর্মী</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-[#16402C]">{activeEmployees.length}</span>
            <span className="text-xs text-gray-500">জন</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-0.5 block">সার্বক্ষণিক খামার পরিচর্যাকারী</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block">আজকের উপস্থিতি</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-[#2A7A50]">
              {todayPresentCount} / {activeEmployees.length}
            </span>
            <span className="text-xs text-gray-500">জন উপস্থিত</span>
          </div>
          <span className="text-[11px] text-[#2A7A50] mt-0.5 block font-medium">১০ অক্টোবর ২০২৬</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block">মাসের মোট বেতন</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-gray-900">
              ৳ {formatCurrency(totalSalaryBudget)}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-0.5 block">চলতি মাস (অক্টোবর ২০২৬)</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 block">কর্মীদের বাকি কাজ</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-[#16402C]">
              {tasks.filter((t) => !t.completed && (t.assignedEmployeeId || t.assignedTo)).length}
            </span>
            <span className="text-xs text-gray-500">টি বাকি কাজ</span>
          </div>
          <span className="text-[11px] text-amber-600 mt-0.5 block font-medium">নিয়মিত গোয়াল ও বায়োগ্যাস কাজ</span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 border border-[#EAE2D0] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম বা পদবী দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#EAE2D0] bg-[#FAF7F0]/40 text-xs md:text-sm outline-hidden focus:border-[#16402C]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {[
            { id: 'all', label: 'সকল কর্মী' },
            { id: 'active', label: 'কাজে আছেন' },
            { id: 'on_leave', label: 'ছুটিতে আছেন' },
            { id: 'inactive', label: 'অনুপস্থিত' },
            { id: 'archived', label: 'সাবেক কর্মী' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#16402C] text-white shadow-2xs'
                  : 'bg-[#FAF7F0] text-gray-600 hover:bg-[#F2ECE1] border border-[#EAE2D0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employees Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {filteredEmployees.map((emp) => {
            // Find today's attendance record
            const todayRecord = attendanceRecords.find(
              (r) => r.employeeId === emp.id && (r.date === TODAY_ISO || r.date.includes('১০ অক্টোবর ২০২৬'))
            );

            const payroll = calculatePayrollStatus(emp, financialRecords, CURRENT_PERIOD);

            return (
              <div
                key={emp.id}
                className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs space-y-4 hover:border-[#16402C]/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header Profile Row */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F2ECE1]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-13 h-13 rounded-2xl bg-[#16402C] text-[#E5B842] font-bold text-lg flex items-center justify-center border border-[#16402C]/20 shadow-xs shrink-0">
                        {emp.avatarInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{emp.name}</h3>
                          {emp.isArchived && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                              আর্কাইভ
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-[#16402C] mt-0.5">{emp.role}</p>
                        <span className="text-[11px] text-gray-500">যোগদান: {emp.joiningDate || 'উদ্ধৃত নেই'}</span>
                      </div>
                    </div>

                    {/* Attendance Status Badge / Quick Trigger */}
                    <button
                      onClick={() => onOpenRecordAttendance(emp.id)}
                      title="হাজিরা পরিবর্তন করতে ক্লিক করুন"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        todayRecord?.status === 'present'
                          ? 'bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0]'
                          : todayRecord?.status === 'leave'
                          ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                          : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          todayRecord?.status === 'present'
                            ? 'bg-[#2A7A50]'
                            : todayRecord?.status === 'leave'
                            ? 'bg-[#D97706]'
                            : 'bg-[#C53030]'
                        }`}
                      />
                      <span>
                        {todayRecord ? todayRecord.statusBn : 'হাজিরা নেই'}
                      </span>
                    </button>
                  </div>

                  {/* Contact & Salary Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF7F0] p-3 rounded-2xl border border-[#EAE2D0]">
                    <div className="space-y-1">
                      <span className="text-gray-500 block">মোবাইল নম্বর:</span>
                      {emp.phone ? (
                        <a
                          href={`tel:${emp.phone}`}
                          className="font-bold text-[#16402C] hover:underline flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#2A7A50]" />
                          <span>{emp.phone}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">নম্বর নেই</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 block">মাসিক বেতন:</span>
                      <span className="font-bold text-gray-900 flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-gray-600" />
                        ৳ {formatCurrency(emp.salaryMonthly)}
                      </span>
                    </div>
                  </div>

                  {/* Payroll Status Banner */}
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-gray-500 text-[11px] block">চলতি মাসের বেতন:</span>
                      <span className="font-bold text-gray-800">
                        পরিশোধিত: ৳ {formatCurrency(payroll.paidAmount)}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        payroll.status === 'paid'
                          ? 'bg-[#EAF5EE] text-[#1B4D35]'
                          : payroll.status === 'partial'
                          ? 'bg-[#FFFBEB] text-[#92400E]'
                          : 'bg-[#FEF2F2] text-[#991B1B]'
                      }`}
                    >
                      {payroll.statusBn}
                    </span>
                  </div>

                  {/* Assigned Duties Checklist Preview */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      দৈনন্দিন নির্ধারিত দায়িত্বসমূহ:
                    </h4>
                    <ul className="space-y-1.5">
                      {emp.assignedDuties.slice(0, 3).map((duty, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-700 flex items-start gap-2 bg-[#FAF7F0]/60 p-2 rounded-xl"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2A7A50] shrink-0 mt-0.5" />
                          <span className="leading-snug">{duty}</span>
                        </li>
                      ))}
                      {emp.assignedDuties.length > 3 && (
                        <p className="text-[11px] text-gray-400 pl-2">
                          + আরও {emp.assignedDuties.length - 3}টি দায়িত্ব রয়েছে...
                        </p>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="pt-3 border-t border-[#F2ECE1] grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedProfileEmployee(emp)}
                    className="py-2 px-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-bold text-xs flex items-center justify-center gap-1 border border-[#EAE2D0] transition-colors"
                  >
                    <span>প্রোফাইল</span>
                  </button>

                  <button
                    onClick={() => onOpenRecordSalaryPayment(emp.id)}
                    className="py-2 px-2 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-bold text-xs flex items-center justify-center gap-1 border border-[#EAE2D0] transition-colors"
                  >
                    <Wallet className="w-3 h-3 text-[#E5B842]" />
                    <span>বেতন দিন</span>
                  </button>

                  <button
                    onClick={() => onOpenAddTask(emp.id)}
                    className="py-2 px-2 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>কাজ দিন</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE2D0] shadow-xs space-y-3">
          <Users className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">কোনো কর্মচারী পাওয়া যায়নি</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            আপনার অনুসন্ধান বা নির্বাচিত ক্যাটাগরিতে কোনো কর্মচারীর তথ্য নেই।
          </p>
          <button
            onClick={onOpenAddEmployee}
            className="px-5 py-2.5 rounded-2xl bg-[#16402C] text-white font-bold text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#E5B842]" />
            <span>নতুন কর্মচারী নিবন্ধন করুন</span>
          </button>
        </div>
      )}

      {/* Employee Profile & History Modal */}
      {selectedProfileEmployee && (
        <EmployeeProfileModal
          isOpen={Boolean(selectedProfileEmployee)}
          onClose={() => setSelectedProfileEmployee(null)}
          employee={selectedProfileEmployee}
          attendanceRecords={attendanceRecords}
          financialRecords={financialRecords}
          tasks={tasks}
          onOpenEditEmployee={onOpenEditEmployee}
          onOpenRecordAttendance={onOpenRecordAttendance}
          onOpenRecordSalaryPayment={onOpenRecordSalaryPayment}
          onDeleteOrArchiveEmployee={onDeleteOrArchiveEmployee}
          onToggleTask={onToggleTask}
        />
      )}
    </div>
  );
};
