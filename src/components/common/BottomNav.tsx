import { useState, type ElementType } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Droplets, 
  Receipt, 
  Menu,
  Users,
  Flame,
  FileBarChart,
  CalendarClock,
  Sparkles,
  Settings,
  X
} from 'lucide-react';
import type { NavigationTab } from '../../types/farm';

interface BottomNavProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  pendingTasksCount: number;
  onOpenAddMilk: () => void;
  onOpenAddExpense: () => void;
}

export const BottomNav = ({
  currentTab,
  onNavigate,
  pendingTasksCount,
  onOpenAddMilk,
  onOpenAddExpense,
}: BottomNavProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const primaryTabs: {
    id: NavigationTab;
    label: string;
    icon: ElementType;
  }[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'cows', label: 'গরু', icon: Layers },
    { id: 'milk', label: 'দুধ', icon: Droplets },
    { id: 'finance', label: 'আয়-ব্যয়', icon: Receipt },
  ];

  const moreTabs: {
    id: NavigationTab;
    label: string;
    labelEn: string;
    icon: React.ElementType;
    badgeCount?: number;
    iconBg: string;
    iconColor: string;
  }[] = [
    { 
      id: 'employees', 
      label: 'কর্মচারী ও বেতন', 
      labelEn: 'Employees & Payroll', 
      icon: Users,
      iconBg: 'bg-teal-50 border border-teal-200/60',
      iconColor: 'text-teal-700'
    },
    { 
      id: 'biogas', 
      label: 'বায়োগ্যাস প্ল্যান্ট', 
      labelEn: 'Biogas & Slurry', 
      icon: Flame,
      iconBg: 'bg-amber-50 border border-amber-200/60',
      iconColor: 'text-amber-700'
    },
    { 
      id: 'reports', 
      label: 'হিসাব বিবরণী', 
      labelEn: 'Monthly Analytics', 
      icon: FileBarChart,
      iconBg: 'bg-emerald-50 border border-emerald-200/60',
      iconColor: 'text-[#16402C]'
    },
    { 
      id: 'reminders', 
      label: 'কাজের তালিকা ও টিকা', 
      labelEn: 'Tasks & Vaccines', 
      icon: CalendarClock, 
      badgeCount: pendingTasksCount,
      iconBg: 'bg-blue-50 border border-blue-200/60',
      iconColor: 'text-blue-700'
    },
    { 
      id: 'advisor', 
      label: 'স্মার্ট পরামর্শক', 
      labelEn: 'AI Farm Advisor', 
      icon: Sparkles,
      iconBg: 'bg-purple-50 border border-purple-200/60',
      iconColor: 'text-purple-700'
    },
    { 
      id: 'settings', 
      label: 'খামার সেটিংস', 
      labelEn: 'Farm Settings & PIN', 
      icon: Settings,
      iconBg: 'bg-slate-100 border border-slate-200/80',
      iconColor: 'text-slate-700'
    },
  ];

  const isMoreActive = moreTabs.some((t) => t.id === currentTab);

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-lg border-t border-[#EAE2D0] z-40 px-2 py-1 shadow-lg pb-safe">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  onNavigate(tab.id);
                  setIsDrawerOpen(false);
                }}
                className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 touch-target ${
                  isActive
                    ? 'text-[#16402C]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <div
                  className={`w-10 h-7.5 rounded-xl flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-linear-to-b from-[#16402C] to-[#1E5739] text-[#E5B842] shadow-xs' 
                      : 'hover:bg-gray-100/80 text-gray-500'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className={`text-[11px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-[#16402C]' : 'font-medium'
                }`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1 rounded-full bg-[#E5B842] mt-0.5" />
                )}
              </button>
            );
          })}

          {/* 5th Tab: More / Menu */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={`flex-1 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all active:scale-95 touch-target relative ${
              isMoreActive ? 'text-[#16402C]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <div
              className={`w-10 h-7.5 rounded-xl flex items-center justify-center transition-all relative ${
                isMoreActive 
                  ? 'bg-linear-to-b from-[#16402C] to-[#1E5739] text-[#E5B842] shadow-xs' 
                  : 'hover:bg-gray-100/80 text-gray-500'
              }`}
            >
              <Menu className="w-4.5 h-4.5" />
              {pendingTasksCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#C53030] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </div>
            <span className={`text-[11px] mt-0.5 tracking-tight ${
              isMoreActive ? 'font-bold text-[#16402C]' : 'font-medium'
            }`}>
              মেনু
            </span>
            {isMoreActive && (
              <span className="w-1.5 h-1 rounded-full bg-[#E5B842] mt-0.5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer for More Items & Quick Actions */}
      {isDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="flex-1"
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="bg-[#FAF7F0] rounded-t-3xl border-t border-[#EAE2D0] p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFC9]">
              <div>
                <h3 className="font-bold text-base text-[#16402C]">খামার মেনু ও বিভাগসমূহ</h3>
                <p className="text-xs text-gray-500">অন্যান্য বিভাগ ও দ্রুত সেবা</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-white border border-[#E8DFC9] hover:bg-gray-100 text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Shortcuts inside Drawer */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenAddMilk();
                }}
                className="p-3.5 rounded-2xl bg-linear-to-r from-[#16402C] to-[#25603E] text-white flex items-center gap-2.5 text-xs font-bold shadow-xs active:scale-98 transition-transform"
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Droplets className="w-4.5 h-4.5 text-[#E5B842]" />
                </div>
                <span>+ দুধের হিসাব</span>
              </button>

              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenAddExpense();
                }}
                className="p-3.5 rounded-2xl bg-white border border-[#9E2A2B]/20 text-[#9E2A2B] flex items-center gap-2.5 text-xs font-bold shadow-xs active:scale-98 transition-transform"
              >
                <div className="w-8 h-8 rounded-xl bg-[#9E2A2B]/10 flex items-center justify-center shrink-0">
                  <Receipt className="w-4.5 h-4.5 text-[#9E2A2B]" />
                </div>
                <span>+ আয় বা খরচ</span>
              </button>
            </div>

            {/* More Navigation Sections */}
            <div className="space-y-2 py-1">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all active:scale-98 ${
                      isActive
                        ? 'bg-linear-to-r from-[#16402C] to-[#215A3A] text-white font-bold shadow-sm'
                        : 'bg-white border border-[#EAE2D0] text-gray-800 hover:bg-[#F2ECE1] font-medium shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/15 text-[#E5B842]' : `${item.iconBg} ${item.iconColor}`
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm leading-tight font-bold">{item.label}</span>
                        <span className={`text-[11px] block mt-0.5 ${
                          isActive ? 'text-[#E5B842]/90' : 'text-gray-400'
                        }`}>
                          {item.labelEn}
                        </span>
                      </div>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C53030] text-white shadow-xs">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
