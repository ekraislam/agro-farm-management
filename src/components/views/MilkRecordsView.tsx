import { useState } from 'react';
import { 
  Droplets, 
  Plus, 
  TrendingUp, 
  DollarSign
} from 'lucide-react';
import type { MilkRecord } from '../../types/farm';

interface MilkRecordsViewProps {
  records: MilkRecord[];
  onOpenAddMilk: () => void;
}

export const MilkRecordsView = ({
  records,
  onOpenAddMilk,
}: MilkRecordsViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(
    (r) =>
      r.date.includes(searchTerm) ||
      (r.recordedBy && r.recordedBy.includes(searchTerm)) ||
      (r.note && r.note.includes(searchTerm))
  );

  const totalAllLiters = records.reduce((sum, r) => sum + r.totalLiters, 0);
  const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
  const avgDaily = Math.round((totalAllLiters / (records.length || 1)) * 10) / 10;

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-[#EAE2D0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2A7A50]/10 text-[#2A7A50]">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#16402C]">দুধের দৈনিক হিসাব</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              প্রতিদিনের সকাল ও বিকালের সংগ্রহ, বিক্রয় দর এবং রাজস্ব ট্র্যাকিং
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAddMilk}
          className="self-start sm:self-auto px-5 py-3 rounded-2xl bg-[#16402C] hover:bg-[#123323] text-white font-bold text-sm shadow-xs flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 text-[#E5B842]" />
          <span>নতুন দুধের হিসাব যোগ করুন</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">আজকের মোট দুধ</p>
            <p className="text-2xl font-bold text-[#16402C] mt-1">
              {records[0]?.totalLiters || 0} <span className="text-sm font-normal">লিটার</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              সকাল: {records[0]?.morningLiters}L • বিকাল: {records[0]?.eveningLiters}L
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2DAC7] text-[#16402C]">
            <Droplets className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">দৈনিক গড় উৎপাদন</p>
            <p className="text-2xl font-bold text-[#16402C] mt-1">
              {avgDaily} <span className="text-sm font-normal">লিটার / দিন</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">বিগত ৭ দিনের হিসাব অনুযায়ী</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2DAC7] text-[#2A7A50]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#FAF7F0] rounded-2xl p-4 border border-[#EAE2D0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">মোট বিক্রয় মূল্য (রেকর্ডকৃত)</p>
            <p className="text-2xl font-bold text-[#16402C] mt-1">
              ৳ {totalAmount.toLocaleString('en-US')}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">গড় দর: ৳ ৮০/লিটার</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2DAC7] text-[#936709]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Records Table / Card List */}
      <div className="bg-white rounded-3xl border border-[#EAE2D0] shadow-xs overflow-hidden">
        <div className="p-4 md:p-5 border-b border-[#F2ECE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-base md:text-lg text-[#16402C]">
            দুধ সংগ্রহের তালিকা
          </h3>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="তারিখ বা হিসাবকারী দিয়ে খুঁজুন..."
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs md:text-sm focus:border-[#16402C] outline-hidden"
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF7F0] border-b border-[#EAE2D0] text-gray-700 text-xs uppercase font-bold">
              <tr>
                <th className="py-3.5 px-4">তারিখ</th>
                <th className="py-3.5 px-4">সকাল (লিটার)</th>
                <th className="py-3.5 px-4">বিকাল (লিটার)</th>
                <th className="py-3.5 px-4">মোট দুধ</th>
                <th className="py-3.5 px-4">দর (লিটার)</th>
                <th className="py-3.5 px-4">মোট টাকা</th>
                <th className="py-3.5 px-4">হিসাবকারী</th>
                <th className="py-3.5 px-4">মন্তব্য</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4EFE2]">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#16402C] whitespace-nowrap">
                    {r.date}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#2A7A50]">
                    {r.morningLiters} লি.
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#936709]">
                    {r.eveningLiters} লি.
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    <span className="bg-[#EAF5EE] text-[#16402C] px-2.5 py-1 rounded-lg border border-[#C5E3D0]">
                      {r.totalLiters} লিটার
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">৳{r.pricePerLiter}</td>
                  <td className="py-3.5 px-4 font-bold text-[#16402C]">
                    ৳{r.totalAmount.toLocaleString('en-US')}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 text-xs">
                    {r.recordedBy}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs max-w-xs truncate">
                    {r.note || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden divide-y divide-[#F4EFE2]">
          {filteredRecords.map((r) => (
            <div key={r.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#16402C]">{r.date}</span>
                <span className="bg-[#EAF5EE] text-[#16402C] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#C5E3D0]">
                  {r.totalLiters} লিটার
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF7F0] p-2.5 rounded-xl border border-[#EAE2D0]">
                <div>
                  <span className="text-gray-500 block">সকাল:</span>
                  <span className="font-bold text-[#2A7A50]">{r.morningLiters} লিটার</span>
                </div>
                <div>
                  <span className="text-gray-500 block">বিকাল:</span>
                  <span className="font-bold text-[#936709]">{r.eveningLiters} লিটার</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-600">
                  মোট মূল্য: <strong className="text-[#16402C] font-bold">৳{r.totalAmount.toLocaleString('en-US')}</strong> (৳{r.pricePerLiter}/লি)
                </span>
                <span className="text-gray-500 text-[11px]">{r.recordedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
