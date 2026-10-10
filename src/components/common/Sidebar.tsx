import type { ElementType } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Droplets, 
  Receipt, 
  Users, 
  Flame, 
  FileBarChart, 
  CalendarClock, 
  Sparkles,
  Settings,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import type { NavigationTab } from '../../types/farm';
import { useAuth } from '../../context/useAuth';

interface SidebarProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  pendingTasksCount: number;
}

export const Sidebar = ({
  currentTab,
  onNavigate,
  pendingTasksCount,
}: SidebarProps) => {
  const { user, isConfigured, isDemoMode } = useAuth();
  const navItems: {
    id: NavigationTab;
    labelBn: string;
    labelEn: string;
    icon: ElementType;
    badgeCount?: number;
  }[] = [
    {
      id: 'dashboard',
      labelBn: 'ড্যাশবোর্ড',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'cows',
      labelBn: 'গরুর তালিকা',
      labelEn: 'Cows List',
      icon: Layers,
    },
    {
      id: 'milk',
      labelBn: 'দুধের হিসাব',
      labelEn: 'Milk Records',
      icon: Droplets,
    },
    {
      id: 'finance',
      labelBn: 'আয়-ব্যয়',
      labelEn: 'Income & Expenses',
      icon: Receipt,
    },
    {
      id: 'employees',
      labelBn: 'কর্মচারী',
      labelEn: 'Employees',
      icon: Users,
    },
    {
      id: 'biogas',
      labelBn: 'বায়োগ্যাস',
      labelEn: 'Biogas Plant',
      icon: Flame,
    },
    {
      id: 'reports',
      labelBn: 'হিসাব বিবরণী',
      labelEn: 'Reports',
      icon: FileBarChart,
    },
    {
      id: 'reminders',
      labelBn: 'কাজের তালিকা',
      labelEn: 'Tasks & Vaccine',
      icon: CalendarClock,
      badgeCount: pendingTasksCount,
    },
    {
      id: 'advisor',
      labelBn: 'স্মার্ট পরামর্শক',
      labelEn: 'Farm Advisor',
      icon: Sparkles,
    },
    {
      id: 'settings',
      labelBn: 'সেটিংস',
      labelEn: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-[#FAF7F0] border-r border-[#EAE2D0] flex flex-col justify-between h-screen sticky top-0 shrink-0">
      {/* Top Branding */}
      <div>
        <div className="p-6 border-b border-[#EAE2D0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#16402C] to-[#2A7A50] text-[#E5B842] flex items-center justify-center font-bold text-lg shadow-xs">
              মু
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#16402C] leading-none">মুমিন এগ্রো</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">খামার ব্যবস্থাপনা</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all font-medium text-sm ${
                  isActive
                    ? 'bg-[#16402C] text-white shadow-xs'
                    : 'text-gray-700 hover:bg-[#F2ECE1] hover:text-[#16402C]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#E5B842]' : 'text-gray-500'}`} />
                  <div>
                    <span className="block leading-tight">{item.labelBn}</span>
                    <span className={`text-[10px] block leading-tight ${
                      isActive ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {item.labelEn}
                    </span>
                  </div>
                </div>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-[#E5B842] text-[#16402C]'
                        : 'bg-[#C53030] text-white'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Farm Owner Info Box & Emergency Card */}
      <div className="p-4 border-t border-[#EAE2D0] space-y-2">
        <div className="p-3 bg-white rounded-2xl border border-[#E8DFC9] shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#16402C]/10 text-[#16402C] flex items-center justify-center font-bold text-xs shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              {isConfigured && user && !isDemoMode ? (
                <>
                  <p className="text-xs font-bold text-gray-800 truncate" title={user.email ?? ''}>
                    {user.email?.split('@')[0]} (মালিক)
                  </p>
                  <p className="text-[10px] text-[#2A7A50] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2A7A50] animate-pulse" />
                    ক্লাউড ডেটাবেজ সংযুক্ত
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-800 truncate">মুমিনুল ইসলাম (মালিক)</p>
                  <p className="text-[10px] text-[#2A7A50] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2A7A50]" />
                    খামার সক্রিয়
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#2A7A50] font-semibold">
            <span>২ জন কর্মী দায়িত্বে আছেন</span>
            <span className="w-2 h-2 rounded-full bg-[#2A7A50] animate-pulse" />
          </div>
        </div>

        {/* Vet Emergency quick contact */}
        <div className="px-3 py-2 bg-[#FAF7F0] rounded-xl flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-[#16402C]" />
            <span className="text-[11px]">পশু চিকিৎসক (ডাক্তার)</span>
          </div>
          <span className="text-[11px] font-bold text-[#16402C]">০১৭XX-XXXXXX</span>
        </div>
      </div>
    </aside>
  );
};
