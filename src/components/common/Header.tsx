import { useState } from 'react';
import { 
  Plus, 
  Droplets, 
  Receipt, 
  PlusCircle, 
  CalendarClock, 
  Bell, 
  Menu,
  UserCheck,
  Download
} from 'lucide-react';
import type { NavigationTab } from '../../types/farm';
import { useAuth } from '../../context/useAuth';
import { CowLogo } from './CowLogo';

interface HeaderProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenAddMilk: () => void;
  onOpenAddExpense: () => void;
  onOpenAddCow: () => void;
  onOpenAddTask: () => void;
  pendingTasksCount: number;
  onOpenMobileMenu: () => void;
  onOpenInstall?: () => void;
  onOpenAuth?: () => void;
  onOpenSetup?: () => void;
  ownerName?: string;
  farmName?: string;
}

export const Header = ({
  onNavigate,
  onOpenAddMilk,
  onOpenAddExpense,
  onOpenAddCow,
  onOpenAddTask,
  pendingTasksCount,
  onOpenMobileMenu,
  onOpenInstall,
  ownerName = 'মুমিনুল ইসলাম',
  farmName = 'মুমিন এগ্রো',
}: HeaderProps) => {
  const { user, isConfigured, isDemoMode } = useAuth();
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Bangla date format
  const banglaDate = 'শনিবার, ১০ অক্টোবর ২০২৬';
  const banglaSubDate = '২৫ আশ্বিন ১৪৩৩ বঙ্গাব্দ';

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#EAE2D0] px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Farm Brand & Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2.5 rounded-xl bg-white border border-[#E2DAC7] text-[#16402C] hover:bg-[#F2ECE1] transition-colors"
            aria-label="মেনু খুলুন"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <CowLogo size={42} rounded="rounded-2xl" className="group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold text-[#16402C] tracking-tight leading-none font-sans">
                  {farmName}
                </h1>
                {isConfigured && user && !isDemoMode ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold bg-[#2A7A50]/15 text-[#16402C] border border-[#2A7A50]/30 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2A7A50] animate-pulse" />
                    ক্লাউড ব্যাকআপ সক্রিয়
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold bg-[#2A7A50]/15 text-[#16402C] border border-[#2A7A50]/30 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2A7A50]" />
                    খামার সক্রিয়
                  </span>
                )}
              </div>
              <p className="text-[11px] md:text-xs text-gray-500 font-medium mt-0.5">
                স্মার্ট ডেইরি ও বায়োগ্যাস খামার
              </p>
            </div>
          </div>
        </div>

        {/* Center / Date badge (visible on md+) */}
        <div className="hidden lg:flex flex-col items-center justify-center px-4 py-1 rounded-xl bg-white/70 border border-[#EBE3D0]">
          <span className="text-xs font-bold text-[#16402C]">{banglaDate}</span>
          <span className="text-[10px] text-gray-500">{banglaSubDate}</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Status Indicator on mobile */}
          {isConfigured && user && !isDemoMode ? (
            <span className="sm:hidden text-[10px] font-bold px-2 py-1 bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0] rounded-lg">
              ক্লাউড
            </span>
          ) : (
            <span className="sm:hidden text-[10px] font-bold px-2 py-1 bg-[#EAF5EE] text-[#1B4D35] border border-[#C5E3D0] rounded-lg">
              সক্রিয়
            </span>
          )}

          {/* Install App Button */}
          <button
            type="button"
            onClick={onOpenInstall}
            className="p-2 md:px-3 md:py-2 rounded-xl bg-[#2A7A50]/10 hover:bg-[#2A7A50]/20 text-[#16402C] border border-[#2A7A50]/30 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer group"
            title="খামার অ্যাপ ইনস্টল করুন"
          >
            <Download className="w-4 h-4 text-[#2A7A50] group-hover:translate-y-0.5 transition-transform" />
            <span className="hidden sm:inline text-xs font-bold">অ্যাপ ইনস্টল</span>
          </button>

          {/* Farm Owner Profile / Settings Navigation (Desktop / Tablet) */}
          <button
            onClick={() => onNavigate('settings')}
            className="hidden sm:flex p-2 md:px-3 md:py-2 rounded-xl bg-white border border-[#E2DAC7] hover:bg-[#FAF7F0] text-[#16402C] transition-colors items-center gap-1.5 shadow-2xs cursor-pointer"
            title="খামার সেটিংস ও ব্যাকআপ"
          >
            <UserCheck className="w-4 h-4 text-[#2A7A50]" />
            <span className="text-xs font-bold truncate">
              {isConfigured && user && !isDemoMode ? `${farmName} (ক্লাউড)` : `${ownerName} (মালিক)`}
            </span>
          </button>

          {/* Pending Tasks Bell */}
          <button
            onClick={() => onNavigate('reminders')}
            className="relative p-2.5 rounded-xl bg-white border border-[#E2DAC7] text-gray-700 hover:text-[#16402C] hover:bg-[#F2ECE1] transition-colors"
            title="বাকি কাজের তালিকা"
          >
            <Bell className="w-5 h-5" />
            {pendingTasksCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C53030] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                {pendingTasksCount}
              </span>
            )}
          </button>

          {/* Quick Action Button (Large Touch Target) */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-2 px-3.5 md:px-4 py-2.5 rounded-xl bg-[#16402C] hover:bg-[#123323] text-white font-semibold text-xs md:text-sm shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-[#E5B842]" />
              <span className="hidden sm:inline">নতুন হিসাব</span>
              <span className="sm:hidden">যোগ</span>
            </button>

            {/* Quick Action Dropdown */}
            {showQuickMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E8DFC9] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    নতুন হিসাব লিখুন
                  </div>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenAddMilk();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs md:text-sm text-gray-700 hover:bg-[#FAF7F0] hover:text-[#16402C] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#2A7A50]/10 text-[#2A7A50]">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <span>দুধের হিসাব যোগ</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenAddExpense();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs md:text-sm text-gray-700 hover:bg-[#FAF7F0] hover:text-[#9E2A2B] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#9E2A2B]/10 text-[#9E2A2B]">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <span>আয় বা খরচ যোগ</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenAddCow();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs md:text-sm text-gray-700 hover:bg-[#FAF7F0] hover:text-[#16402C] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#16402C]/10 text-[#16402C]">
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <span>নতুন গরু যোগ</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenAddTask();
                    }}
                    className="w-full px-3.5 py-2.5 text-left text-xs md:text-sm text-gray-700 hover:bg-[#FAF7F0] hover:text-[#8C6200] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#E5B842]/20 text-[#8C6200]">
                      <CalendarClock className="w-4 h-4" />
                    </div>
                    <span>নতুন কাজ / অনুস্মারক</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
