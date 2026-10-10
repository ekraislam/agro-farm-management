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
  }[] = [
    { id: 'employees', label: 'কর্মচারী', labelEn: 'Employees', icon: Users },
    { id: 'biogas', label: 'বায়োগ্যাস প্ল্যান্ট', labelEn: 'Biogas System', icon: Flame },
    { id: 'reports', label: 'রিপোর্ট ও বিশ্লেষণ', labelEn: 'Farm Reports', icon: FileBarChart },
    { id: 'reminders', label: 'অনুস্মারক ও কাজ', labelEn: 'Tasks & Vaccines', icon: CalendarClock, badgeCount: pendingTasksCount },
    { id: 'advisor', label: 'AI খামার উপদেষ্টা', labelEn: 'AI Advisor', icon: Sparkles },
    { id: 'settings', label: 'সেটিংস ও প্রোফাইল', labelEn: 'Settings', icon: Settings },
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
                className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all touch-target ${
                  isActive
                    ? 'text-[#16402C]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-transform ${
                    isActive ? 'bg-[#16402C]/10 scale-105' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#16402C]' : 'text-gray-500'}`} />
                </div>
                <span className={`text-[11px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-[#16402C]' : 'font-medium'
                }`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#E5B842] mt-0.5" />
                )}
              </button>
            );
          })}

          {/* 5th Tab: More / Menu */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all touch-target relative ${
              isMoreActive ? 'text-[#16402C]' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <div className={`p-1 rounded-xl relative ${isMoreActive ? 'bg-[#16402C]/10' : ''}`}>
              <Menu className={`w-5 h-5 ${isMoreActive ? 'text-[#16402C]' : 'text-gray-500'}`} />
              {pendingTasksCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#C53030] rounded-full ring-2 ring-white" />
              )}
            </div>
            <span className={`text-[11px] mt-0.5 tracking-tight ${
              isMoreActive ? 'font-bold text-[#16402C]' : 'font-medium'
            }`}>
              মেনু
            </span>
            {isMoreActive && (
              <span className="w-1 h-1 rounded-full bg-[#E5B842] mt-0.5" />
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

          <div className="bg-white rounded-t-3xl border-t border-[#EAE2D0] p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-base text-[#16402C]">খামার মেনু ও বিভাগসমূহ</h3>
                <p className="text-xs text-gray-500">অন্যান্য বিভাগ ও দ্রুত সেবা</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
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
                className="p-3 rounded-2xl bg-[#16402C]/10 border border-[#16402C]/20 text-[#16402C] flex items-center gap-2.5 text-xs font-bold"
              >
                <Droplets className="w-4 h-4 text-[#2A7A50]" />
                <span>+ দুধের হিসাব</span>
              </button>

              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenAddExpense();
                }}
                className="p-3 rounded-2xl bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 text-[#9E2A2B] flex items-center gap-2.5 text-xs font-bold"
              >
                <Receipt className="w-4 h-4 text-[#9E2A2B]" />
                <span>+ খরচ / আয় যোগ</span>
              </button>
            </div>

            {/* More Navigation Sections */}
            <div className="space-y-1.5 py-2">
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
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-[#16402C] text-white font-bold'
                        : 'bg-[#FAF7F0] text-gray-800 hover:bg-[#F2ECE1] font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        isActive ? 'bg-white/20 text-[#E5B842]' : 'bg-white text-[#16402C]'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="block text-sm leading-tight">{item.label}</span>
                        <span className={`text-[11px] block ${
                          isActive ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          {item.labelEn}
                        </span>
                      </div>
                    </div>

                    {item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#C53030] text-white">
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
