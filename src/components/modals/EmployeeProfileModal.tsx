import { useState } from 'react';
import { 
  X, 
  Phone, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Edit3, 
  Archive, 
  Plus, 
  CheckSquare,
  XCircle,
  AlertCircle
} from 'lucide-react';
import type { 
  Employee, 
  AttendanceRecord, 
  FinancialRecord, 
  ReminderTask 
} from '../../types/farm';
import { calculateMonthlyAttendance, calculatePayrollStatus } from '../../utils/employeeAccounting';

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  attendanceRecords: AttendanceRecord[];
  financialRecords: FinancialRecord[];
  tasks: ReminderTask[];
  onOpenEditEmployee: (emp: Employee) => void;
  onOpenRecordAttendance: (empId: string) => void;
  onOpenRecordSalaryPayment: (empId: string) => void;
  onDeleteOrArchiveEmployee: (empId: string) => void;
  onToggleTask: (taskId: string) => void;
}

export const EmployeeProfileModal = ({
  isOpen,
  onClose,
  employee,
  attendanceRecords,
  financialRecords,
  tasks,
  onOpenEditEmployee,
  onOpenRecordAttendance,
  onOpenRecordSalaryPayment,
  onDeleteOrArchiveEmployee,
  onToggleTask,
}: EmployeeProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'payroll' | 'tasks'>('overview');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');

  if (!isOpen || !employee) return null;

  // Filter attendance for this employee
  const empAttendance = attendanceRecords.filter((r) => r.employeeId === employee.id);
  const monthlySummary = calculateMonthlyAttendance(attendanceRecords, employee.id, selectedMonth);
  const payrollStatus = calculatePayrollStatus(employee, financialRecords, selectedMonth);
  const empTasks = tasks.filter((t) => t.assignedEmployeeId === employee.id || t.assignedTo === employee.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-[#E8DFC9] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-[#F2ECE1] bg-[#FAF7F0] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#16402C] text-[#E5B842] font-bold text-xl flex items-center justify-center border border-[#16402C]/20 shadow-xs shrink-0">
              {employee.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{employee.name}</h2>
                {employee.isArchived ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
                    সাবেক কর্মী (তালিকায় নেই)
                  </span>
                ) : employee.status === 'active' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0]">
                    কাজে সক্রিয়
                  </span>
                ) : employee.status === 'on_leave' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                    ছুটিতে আছেন
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                    সাবেক কর্মী
                  </span>
                )}
              </div>
              <p className="text-xs md:text-sm font-semibold text-[#16402C] mt-0.5">{employee.role}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span>যোগদান: {employee.joiningDate || 'তারিখ নেই'}</span>
                <span>•</span>
                <span>মাসিক বেতন: ৳ {employee.salaryMonthly.toLocaleString('en-US')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#F2ECE1] bg-white px-5 overflow-x-auto text-xs md:text-sm">
          {[
            { id: 'overview', label: 'সারসংক্ষেপ' },
            { id: 'attendance', label: `হাজিরা (${empAttendance.length})` },
            { id: 'payroll', label: 'বেতন ও লেনদেন' },
            { id: 'tasks', label: `দায়িত্ব ও কাজ (${empTasks.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#16402C] text-[#16402C]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="overflow-y-auto p-5 md:p-6 flex-1 text-xs md:text-sm space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF7F0] p-4 rounded-2xl border border-[#EAE2D0]">
                <div>
                  <span className="text-gray-500 text-xs block mb-1">মোবাইল নম্বর:</span>
                  {employee.phone ? (
                    <a
                      href={`tel:${employee.phone}`}
                      className="font-bold text-[#16402C] text-sm hover:underline flex items-center gap-1.5"
                    >
                      <Phone className="w-4 h-4 text-[#2A7A50]" />
                      <span>{employee.phone}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">নম্বর নেই</span>
                  )}
                </div>

                <div>
                  <span className="text-gray-500 text-xs block mb-1">মাসিক বেতন:</span>
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-[#2A7A50]" />
                    <span>৳ {employee.salaryMonthly.toLocaleString('en-US')}</span>
                  </div>
                </div>
              </div>

              {/* Duties Checklist */}
              <div>
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">
                  দৈনিক কাজের দায়িত্বসমূহ:
                </h4>
                {employee.assignedDuties && employee.assignedDuties.length > 0 ? (
                  <ul className="space-y-2">
                    {employee.assignedDuties.map((duty, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#FAF7F0]/70 border border-[#EAE2D0] flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#2A7A50] shrink-0 mt-0.5" />
                        <span className="text-gray-800 leading-snug">{duty}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 italic">কোনো নির্দিষ্ট দায়িত্ব তালিকায় নেই।</p>
                )}
              </div>

              {/* Notes */}
              {employee.notes && (
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-xs font-bold text-gray-600 block mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span>মন্তব্য ও অন্যান্য তথ্য:</span>
                  </span>
                  <p className="text-gray-700">{employee.notes}</p>
                </div>
              )}

              {/* Management Actions */}
              <div className="pt-4 border-t border-[#F2ECE1] flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onOpenEditEmployee(employee);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] hover:bg-[#F2ECE1] text-[#16402C] font-bold text-xs flex items-center gap-2 border border-[#EAE2D0] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>তথ্য পরিবর্তন</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onDeleteOrArchiveEmployee(employee.id);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] font-bold text-xs flex items-center gap-2 border border-[#FECACA] transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>{employee.isArchived ? 'স্থায়ীভাবে মুছুন' : 'কর্মী পুরোনো তালিকায় রাখুন'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ATTENDANCE HISTORY */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Header with Month Selector & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#EAE2D0]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#16402C]" />
                  <span className="font-bold text-gray-800 text-xs">মাস নির্বাচন:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-[#EAE2D0] bg-white text-xs font-bold outline-hidden focus:border-[#16402C]"
                  >
                    <option value="2026-10">অক্টোবর ২০২৬</option>
                    <option value="2026-09">সেপ্টেম্বর ২০২৬</option>
                    <option value="2026-08">আগস্ট ২০২৬</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenRecordAttendance(employee.id);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#16402C] text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto hover:bg-[#123323]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>হাজিরা যোগ করুন</span>
                </button>
              </div>

              {/* Monthly Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#EAF5EE] p-3 rounded-2xl border border-[#C5E3D0]">
                  <p className="text-[11px] font-semibold text-[#1B4D35]">উপস্থিত</p>
                  <p className="text-xl font-bold text-[#16402C] mt-0.5">{monthlySummary.presentDays} দিন</p>
                </div>
                <div className="bg-[#FEF2F2] p-3 rounded-2xl border border-[#FECACA]">
                  <p className="text-[11px] font-semibold text-[#991B1B]">অনুপস্থিত</p>
                  <p className="text-xl font-bold text-[#991B1B] mt-0.5">{monthlySummary.absentDays} দিন</p>
                </div>
                <div className="bg-[#FFFBEB] p-3 rounded-2xl border border-[#FDE68A]">
                  <p className="text-[11px] font-semibold text-[#92400E]">ছুটি</p>
                  <p className="text-xl font-bold text-[#92400E] mt-0.5">{monthlySummary.leaveDays} দিন</p>
                </div>
                <div className="bg-[#FAF7F0] p-3 rounded-2xl border border-[#EAE2D0]">
                  <p className="text-[11px] font-semibold text-gray-600">উপস্থিতি হার</p>
                  <p className="text-xl font-bold text-[#16402C] mt-0.5">{monthlySummary.attendanceRatePercent}%</p>
                </div>
              </div>

              {/* Attendance Log List */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                  দৈনিক হাজিরার খাতা:
                </h4>
                {empAttendance.length > 0 ? (
                  <div className="divide-y divide-[#F2ECE1] border border-[#EAE2D0] rounded-2xl overflow-hidden bg-white">
                    {empAttendance.map((att) => (
                      <div key={att.id} className="p-3 flex items-center justify-between gap-3 hover:bg-[#FAF7F0]/40">
                        <div className="flex items-center gap-2.5">
                          {att.status === 'present' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#2A7A50] shrink-0" />
                          ) : att.status === 'leave' ? (
                            <Clock className="w-4 h-4 text-[#D97706] shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-gray-900 block">{att.date}</span>
                            {att.notes && <span className="text-[11px] text-gray-500">{att.notes}</span>}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              att.status === 'present'
                                ? 'bg-[#EAF5EE] text-[#1B4D35] border-[#C5E3D0]'
                                : att.status === 'leave'
                                ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                                : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                            }`}
                          >
                            {att.statusBn}
                          </span>
                          {att.arrivalTime && (
                            <span className="block text-[11px] text-gray-400 mt-0.5">
                              {att.arrivalTime} - {att.departureTime || '১৮:০০'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-[#FAF7F0]/50 rounded-2xl border border-[#EAE2D0] text-gray-500">
                    <p className="text-sm">এই কর্মীর কোনো হাজিরার হিসাব লেখা হয়নি।</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PAYROLL & SALARY */}
          {activeTab === 'payroll' && (
            <div className="space-y-4">
              {/* Month Selector & Pay Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF7F0] p-3.5 rounded-2xl border border-[#EAE2D0]">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#16402C]" />
                  <span className="font-bold text-gray-800 text-xs">বেতনের মাস:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-[#EAE2D0] bg-white text-xs font-bold outline-hidden focus:border-[#16402C]"
                  >
                    <option value="2026-10">অক্টোবর ২০২৬</option>
                    <option value="2026-09">সেপ্টেম্বর ২০২৬</option>
                    <option value="2026-08">আগস্ট ২০২৬</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenRecordSalaryPayment(employee.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#16402C] text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto hover:bg-[#123323] shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span>বেতন পরিশোধ করুন</span>
                </button>
              </div>

              {/* Payroll Status Card */}
              <div className="p-4 bg-white rounded-2xl border border-[#EAE2D0] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#F2ECE1]">
                  <div>
                    <p className="text-xs text-gray-500">মাসিক নির্ধারিত বেতন</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">
                      ৳ {employee.salaryMonthly.toLocaleString('en-US')}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      payrollStatus.status === 'paid'
                        ? 'bg-[#EAF5EE] text-[#1B4D35] border-[#C5E3D0]'
                        : payrollStatus.status === 'partial'
                        ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                        : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                    }`}
                  >
                    {payrollStatus.statusBn}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 block">পরিশোধিত অর্থ:</span>
                    <span className="text-base font-bold text-[#2A7A50]">
                      ৳ {payrollStatus.paidAmount.toLocaleString('en-US')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">অবশিষ্ট বকেয়া:</span>
                    <span className={`text-base font-bold ${payrollStatus.dueAmount > 0 ? 'text-[#C53030]' : 'text-gray-600'}`}>
                      ৳ {payrollStatus.dueAmount.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions History */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                  বেতন দেওয়ার ইতিহাস:
                </h4>
                {payrollStatus.payments.length > 0 ? (
                  <div className="divide-y divide-[#F2ECE1] border border-[#EAE2D0] rounded-2xl overflow-hidden bg-white">
                    {payrollStatus.payments.map((tx) => (
                      <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{tx.title}</p>
                          <span className="text-xs text-gray-500">
                            তারিখ: {tx.date} • মাধ্যম: {tx.paymentMethod === 'cash' ? 'নগদ টাকা' : tx.paymentMethod === 'bkash' ? 'বিকাশ' : 'ব্যাংক'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-[#C53030] text-sm block">
                            - ৳ {tx.amount.toLocaleString('en-US')}
                          </span>
                          <span className="text-[11px] text-gray-400">খরচ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-[#FAF7F0]/40 rounded-2xl border border-[#EAE2D0] text-center text-gray-500">
                    <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs">এই মাসের কোনো বেতন পরিশোধের হিসাব লেখা হয়নি।</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                  এই কর্মীকে নির্ধারিত দায়িত্ব ও কাজ:
                </h4>
                <span className="text-xs text-gray-500">মোট: {empTasks.length}টি</span>
              </div>

              {empTasks.length > 0 ? (
                <div className="space-y-2">
                  {empTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                        t.completed ? 'bg-gray-50/80 border-gray-200 opacity-75' : 'bg-white border-[#EAE2D0] shadow-2xs'
                      }`}
                    >
                      <button
                        onClick={() => onToggleTask(t.id)}
                        className={`mt-0.5 p-1 rounded-lg border transition-colors ${
                          t.completed ? 'bg-[#2A7A50] border-[#2A7A50] text-white' : 'border-gray-300 hover:border-[#16402C]'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${t.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{t.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
                          <span className="font-medium text-[#16402C]">মেয়াদ: {t.dueDate}</span>
                          <span>•</span>
                          <span className="px-2 py-0.2 rounded-full bg-gray-100 text-gray-700 font-semibold">
                            {t.priorityBn}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-[#FAF7F0]/40 rounded-2xl border border-[#EAE2D0] text-center text-gray-500">
                  <p className="text-sm">এই কর্মীর নামে বর্তমানে কোনো জরুরি কাজ নেই।</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
