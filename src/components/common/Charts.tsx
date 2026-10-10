import { formatCurrency } from '../../utils/accounting';
import { useState } from 'react';
import { Droplets, TrendingUp, DollarSign } from 'lucide-react';
import type { MilkRecord } from '../../types/farm';

interface MilkTrendChartProps {
  records: MilkRecord[];
}

export const MilkTrendChart = ({ records }: MilkTrendChartProps) => {
  // Sort or take last 7 records in chronological order
  const displayRecords = [...records].slice(0, 7).reverse();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    displayRecords.length > 0 ? displayRecords.length - 1 : null
  );

  const avgDaily =
    displayRecords.length > 0
      ? (
          displayRecords.reduce((sum, r) => sum + r.totalLiters, 0) /
          displayRecords.length
        ).toFixed(1)
      : '০';

  const maxMilk =
    displayRecords.length > 0
      ? Math.max(...displayRecords.map((r) => r.totalLiters), 10)
      : 10;
  const selectedRecord =
    selectedIndex !== null && displayRecords[selectedIndex]
      ? displayRecords[selectedIndex]
      : null;

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#EBE4D5] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F2ECE1]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#16402C]/10 text-[#16402C]">
              <Droplets className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base md:text-lg text-[#16402C]">
              দুধ উৎপাদনের সাপ্তাহিক ট্রেন্ড
            </h3>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            বিগত ৭ দিনের সকাল ও বিকালের দুধের তুলনামূলক হিসাব
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#2A7A50]" />
            <span className="text-gray-700">সকাল (Morning)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#D4A017]" />
            <span className="text-gray-700">বিকাল (Evening)</span>
          </div>
        </div>
      </div>

      {displayRecords.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-gray-500">
          <div className="w-12 h-12 rounded-full bg-[#EAF5EE] text-[#2A7A50] flex items-center justify-center mb-3">
            <Droplets className="w-6 h-6" />
          </div>
          <p className="font-semibold text-gray-700 text-sm">এখনো কোনো দুধ সংগ্রহের রেকর্ড নেই</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            প্রতিদিনের দুধ দোয়ানোর হিসাব যোগ করলে এখানে বিগত ৭ দিনের সকাল ও বিকালের চার্ট দেখতে পাবেন।
          </p>
        </div>
      ) : (
        <>
          {/* Selected Day Quick Inspector */}
          {selectedRecord && (
            <div className="my-3 p-3 bg-[#FAF7F0] rounded-xl border border-[#EBE3D0] flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
              <div className="font-semibold text-[#16402C]">
                তারিখ: {selectedRecord.date}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#1B4D35]">
                  সকাল: <strong className="font-bold">{selectedRecord.morningLiters}</strong> লি.
                </span>
                <span className="text-[#936709]">
                  বিকাল: <strong className="font-bold">{selectedRecord.eveningLiters}</strong> লি.
                </span>
                <span className="bg-[#16402C] text-white px-2 py-0.5 rounded-md font-bold">
                  মোট: {selectedRecord.totalLiters} লিটার
                </span>
              </div>
            </div>
          )}

          {/* SVG Responsive Bar Chart */}
          <div className="mt-4 pt-2">
            <div className="h-48 md:h-56 w-full flex items-end justify-between gap-2 md:gap-4 px-1 pb-6 pt-4 border-b border-[#EAE3D2] relative">
              {/* Subtle grid lines */}
              <div className="absolute inset-x-0 top-0 border-b border-dashed border-gray-200 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-gray-200 pointer-events-none" />

              {displayRecords.map((item, idx) => {
                const morningHeightPercent = (item.morningLiters / maxMilk) * 100;
                const eveningHeightPercent = (item.eveningLiters / maxMilk) * 100;
                const isSelected = selectedIndex === idx;

                // Short date label (e.g. "০৪ অক্টো")
                const shortDate = item.date.split(' ').slice(0, 2).join(' ');

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIndex(idx)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Total label above bar */}
                    <span className={`text-[11px] md:text-xs font-bold mb-1 transition-colors ${
                      isSelected ? 'text-[#16402C]' : 'text-gray-500 group-hover:text-gray-800'
                    }`}>
                      {item.totalLiters}L
                    </span>

                    {/* Stacked Bar */}
                    <div
                      className={`w-full max-w-[36px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-[#16402C] ring-offset-1' : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{ height: `${morningHeightPercent + eveningHeightPercent}%` }}
                    >
                      {/* Evening bar segment */}
                      <div
                        className="w-full bg-[#D4A017] transition-all"
                        style={{ height: `${(eveningHeightPercent / (morningHeightPercent + eveningHeightPercent)) * 100}%` }}
                        title={`বিকাল: ${item.eveningLiters} লি.`}
                      />
                      {/* Morning bar segment */}
                      <div
                        className="w-full bg-[#2A7A50] transition-all"
                        style={{ height: `${(morningHeightPercent / (morningHeightPercent + eveningHeightPercent)) * 100}%` }}
                        title={`সকাল: ${item.morningLiters} লি.`}
                      />
                    </div>

                    {/* X-axis date */}
                    <span className={`absolute -bottom-6 text-[10px] md:text-xs whitespace-nowrap transition-colors ${
                      isSelected ? 'font-bold text-[#16402C]' : 'text-gray-500'
                    }`}>
                      {shortDate}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 mt-7 pt-1 px-1">
              <span>* বারে ট্যাপ করে ঐ দিনের সকাল ও বিকালের হিসাব দেখুন</span>
              <span className="font-semibold text-[#16402C] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#2A7A50]" /> গড় দৈনিক: {avgDaily} লিটার
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface IncomeExpenseChartProps {
  monthIncome: number;
  monthExpenses: number;
  estimatedProfit: number;
}

export const IncomeExpenseChart = ({
  monthIncome,
  monthExpenses,
  estimatedProfit,
}: IncomeExpenseChartProps) => {
  const totalFlow = monthIncome + monthExpenses;
  const incomePct = totalFlow > 0 ? Math.round((monthIncome / totalFlow) * 100) : 0;
  const expensePct = totalFlow > 0 ? Math.round((monthExpenses / totalFlow) * 100) : 0;
  const isSurplus = estimatedProfit >= 0;
  const marginPct = monthIncome > 0 ? Math.round(((estimatedProfit / monthIncome) * 100) * 10) / 10 : 0;

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-[#EBE4D5] shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-[#F2ECE1]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#D4A017]/15 text-[#936709]">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base md:text-lg text-[#16402C]">
              চলতি মাসের আর্থিক পর্যালোচনা
            </h3>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            আয় বনাম ব্যয়ের তুলনামূলক অনুপাত
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
          totalFlow === 0
            ? 'bg-[#FAF7F0] text-gray-600 border-[#EAE2D0]'
            : isSurplus
            ? 'bg-[#EAF5EE] text-[#1B4D35] border-[#C5E3D0]'
            : 'bg-[#FDF2F2] text-[#9E2A2B] border-[#F8C8C8]'
        }`}>
          {totalFlow === 0 ? 'হিসাব শুরু করুন' : isSurplus ? 'লাভজনক খামার' : 'পরিচালন ঘাটতি'}
        </span>
      </div>

      {/* Progress Bar Visual Representation */}
      <div className="mt-4 space-y-3">
        <div className="flex justify-between items-end text-xs md:text-sm">
          <span className="text-[#16402C] font-semibold">
            মোট আয়: ৳ {formatCurrency(monthIncome)} ({incomePct}%)
          </span>
          <span className="text-[#C53030] font-semibold">
            মোট ব্যয়: ৳ {formatCurrency(monthExpenses)} ({expensePct}%)
          </span>
        </div>

        {/* Stacked comparison bar */}
        <div className="w-full h-4 md:h-5 bg-gray-100 rounded-full overflow-hidden flex border border-[#EBE3D0]">
          <div
            className="bg-[#2A7A50] h-full transition-all duration-500"
            style={{ width: `${incomePct}%` }}
            title={`আয়: ৳ ${monthIncome}`}
          />
          <div
            className="bg-[#C53030] h-full transition-all duration-500"
            style={{ width: `${expensePct}%` }}
            title={`ব্যয়: ৳ ${monthExpenses}`}
          />
        </div>
      </div>

      {/* 3 Metric Cards for quick clarity */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4 pt-2">
        <div className="bg-[#F3F9F5] rounded-xl p-2.5 md:p-3 border border-[#D5EADF] text-center">
          <p className="text-[11px] md:text-xs text-gray-600 font-medium">মোট আয়</p>
          <p className="text-sm md:text-base font-bold text-[#16402C] mt-0.5">
            ৳{formatCurrency(monthIncome)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">দুধ ও অন্যান্য</p>
        </div>

        <div className="bg-[#FDF3F3] rounded-xl p-2.5 md:p-3 border border-[#F9D7D7] text-center">
          <p className="text-[11px] md:text-xs text-gray-600 font-medium">মোট ব্যয়</p>
          <p className="text-sm md:text-base font-bold text-[#C53030] mt-0.5">
            ৳{formatCurrency(monthExpenses)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">খাদ্য, বেতন ও ঔষধ</p>
        </div>

        <div className="bg-[#FEF9E7] rounded-xl p-2.5 md:p-3 border border-[#F7E2A9] text-center">
          <p className="text-[11px] md:text-xs text-[#936709] font-medium">নিট ফলাফল</p>
          <p className={`text-sm md:text-base font-bold mt-0.5 ${
            totalFlow === 0
              ? 'text-gray-700'
              : isSurplus
              ? 'text-[#805B00]'
              : 'text-[#9E2A2B]'
          }`}>
            {totalFlow > 0 && isSurplus ? '+' : ''}৳{formatCurrency(estimatedProfit)}
          </p>
          <p className="text-[10px] text-[#936709] mt-0.5">
            {totalFlow === 0 ? 'উদ্বৃত্ত/ঘাটতি' : isSurplus ? 'পরিচালন উদ্বৃত্ত' : 'পরিচালন ঘাটতি'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F2ECE1] text-xs text-gray-600 flex items-center justify-between">
        <span>* দুধ বিক্রির আয় প্রতিদিন আপডেট হয়</span>
        <span className={`font-semibold ${isSurplus ? 'text-[#16402C]' : 'text-[#9E2A2B]'}`}>
          মার্জিন: {marginPct > 0 ? `+${marginPct}` : `${marginPct}`}%
        </span>
      </div>
    </div>
  );
};
