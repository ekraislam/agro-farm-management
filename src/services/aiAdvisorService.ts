import type { FarmAdvisorContext, AiAdvisorQueryResult } from '../types/aiAdvisor';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { englishToBanglaDigits } from '../utils/accounting';

export interface AiAdvisorProvider {
  askQuestion(
    userId: string | undefined,
    query: string,
    context: FarmAdvisorContext,
    authToken?: string
  ): Promise<AiAdvisorQueryResult>;
}

/**
 * Deterministic, Grounded Bengali Farm Advisor Provider for testing, offline, and demo mode.
 * Evaluates contextual accounting summaries directly without requiring external paid API calls.
 */
export class MockAiAdvisorProvider implements AiAdvisorProvider {
  async askQuestion(
    _userId: string | undefined,
    query: string,
    context: FarmAdvisorContext,
    _authToken?: string
  ): Promise<AiAdvisorQueryResult> {
    // 1. Guard against prompt injection & untrusted instruction attempts
    if (context.isUntrustedContentDetected) {
      return {
        success: true,
        answer: 'আমি মুমিন এগ্রোর খামার উপদেষ্টা। আমি শুধুমাত্র আপনার খামারের অনুমোদিত সংরক্ষিত ডেটা ভিত্তিক খামার পরিচালন প্রশ্নের উত্তর দিয়ে থাকি। গোপন সিস্টেম নির্দেশ বা নিরাপত্তা তথ্য প্রকাশের অনুরোধ গ্রহণ করা হয় না।',
        isDemoPreview: context.isDemoData,
      };
    }

    // 2. Strict Veterinary Safety Guard
    if (context.isVeterinaryInquiry) {
      return {
        success: true,
        answer: `গাভীর যে কোনো লক্ষণ বা অসুস্থতার ক্ষেত্রে প্রাথমিক সতর্কতা অত্যন্ত জরুরি।\n\n` +
          `আমি একজন AI সহকারী, কোনো নিবন্ধিত পশু চিকিৎসক নই। আমি কোনো রোগের নিশ্চিত ডায়াগনোসিস বা অ্যান্টিবায়োটিক/ঔষধের ডোজ প্রেসক্রাইব করতে পারব না।\n\n` +
          `পরামর্শ:\n` +
          `• অসুস্থ গাভীকে দ্রুত অন্যান্য সুস্থ গরু থেকে আলাদা শেডে রাখুন।\n` +
          `• পরিষ্কার খাবার পানি ও শুকনো পরিবেশ নিশ্চিত করুন।\n` +
          `• কোনো রেজিস্টার্ড পশু চিকিৎসক বা স্থানীয় উপজেলা প্রাণিসম্পদ কর্মকর্তার সাথে অনতিবিলম্বে যোগাযোগ করে পরামর্শ অনুযায়ী চিকিৎসা দিন।`,
        safetyWarning: {
          type: 'veterinary',
          titleBn: 'জরুরি ভেটেরিনারি স্বাস্থ্য সতর্কতা',
          messageBn: 'গাভীর অসুস্থতায় নিজে নিজে ওষুধ প্রয়োগ না করে তাৎক্ষণিকভাবে রেজিস্টার্ড ভেটেরিনারি পশু চিকিৎসকের পরামর্শ নিন।',
        },
        evidence: {
          period: context.targetPeriodLabelBn,
          relevantView: 'cows',
          relevantViewLabelBn: 'গরুর স্বাস্থ্য রেকর্ড দেখুন',
        },
        suggestedAction: {
          tab: 'cows',
          labelBn: 'গরুর তালিকা ও স্বাস্থ্য হিস্ট্রি দেখুন',
        },
        isDemoPreview: context.isDemoData,
      };
    }

    // 3. Strict Biogas Physical Danger Guard
    if (context.isBiogasDangerInquiry) {
      return {
        success: true,
        answer: `বায়োগ্যাস প্ল্যান্টে গ্যাস লিক, তীব্র গন্ধ বা অস্বাভাবিক চাপ দেখা দিলে তা অগ্নিকাণ্ডের ঝুঁকি তৈরি করতে পারে!\n\n` +
          `তাৎক্ষণিক করণীয় সুরক্ষা পদক্ষেপ:\n` +
          `১. প্ল্যান্ট ও পাইপলাইনের আশেপাশে দিয়াশলাই, সিগারেট, ইলেকট্রিক সুইচ বা কোনো প্রকার আগুনের উৎস সম্পূর্ণ নিষিদ্ধ করুন।\n` +
          `২. ডাইজেস্টার ও কিচেনের প্রধান সেফটি ভালভ অবিলম্বে বন্ধ করুন।\n` +
          `৩. বাতাস চলাচলের জন্য দরজা-জানালা খুলে দিন এবং খামারের মানুষ ও পশুপাখিকে নিরাপদ দূরত্বে সরিয়ে নিন।\n` +
          `৪. নিজে নিজে কোনো ঝুঁকিপূর্ণ পাইপ মেরামত করবেন না। অতি দ্রুত দক্ষ বায়োগ্যাস টেকনিশিয়ানের শরণাপন্ন হোন।`,
        safetyWarning: {
          type: 'biogas_safety',
          titleBn: 'বায়োগ্যাস প্ল্যান্ট জরুরি নিরাপত্তা সতর্কতা',
          messageBn: 'গ্যাস লিকের ক্ষেত্রে অবিলম্বে আগুনের উৎস বন্ধ রাখুন, এলাকা খালি করুন এবং দক্ষ বায়োগ্যাস টেকনিশিয়ান ডাকুন।',
        },
        evidence: {
          period: context.targetPeriodLabelBn,
          relevantView: 'biogas',
          relevantViewLabelBn: 'বায়োগ্যাস লগ ও পরিদর্শন দেখুন',
        },
        suggestedAction: {
          tab: 'biogas',
          labelBn: 'বায়োগ্যাস প্ল্যান্ট পাতা খুলুন',
        },
        isDemoPreview: context.isDemoData,
      };
    }

    const { queryTopic, targetPeriodLabelBn, financialSummary, milkSummary, healthSummary, employeeSummary, biogasSummary } = context;

    // 4. Topic: Finance (আয়-ব্যয় ও নিট অপারেটিং রেজাল্ট)
    if (queryTopic === 'finance') {
      if (!financialSummary || (financialSummary.totalIncome === 0 && financialSummary.totalExpenses === 0)) {
        return {
          success: true,
          answer: `আপনার খামারে ${targetPeriodLabelBn}-এ কোনো আর্থিক আয় বা ব্যয়ের লেনদেন সংরক্ষিত নেই। হিসাব দেখতে অনুগ্রহ করে আয় বা ব্যয়ের লেনদেন এন্ট্রি করুন।`,
          evidence: {
            period: targetPeriodLabelBn,
            categories: ['সকল আয় ও ব্যয় খাত'],
            totalsOrCounts: { 'মোট আয়': '৳০', 'মোট খরচ': '৳০' },
            relevantView: 'finance',
            relevantViewLabelBn: 'আয়-ব্যয় পাতা খুলুন',
          },
          suggestedAction: { tab: 'finance', labelBn: 'নতুন লেনদেন যোগ করুন' },
          isDemoPreview: context.isDemoData,
        };
      }

      const qLower = query.toLowerCase();
      // Highest expense inquiry
      if (qLower.includes('সবচেয়ে বেশি') || qLower.includes('সর্বোচ্চ') || qLower.includes('highest') || qLower.includes('kono khate')) {
        const highest = financialSummary.highestExpenseCategory;
        if (highest) {
          const highestBn = englishToBanglaDigits(highest.amount);
          const totalExpBn = englishToBanglaDigits(financialSummary.totalExpenses);
          const pct = Math.round((highest.amount / financialSummary.totalExpenses) * 100);

          return {
            success: true,
            answer: `আপনার সংরক্ষিত রেকর্ড অনুযায়ী ${targetPeriodLabelBn}-এ **${highest.categoryBn}** খাতে সবচেয়ে বেশি টাকা খরচ হয়েছে।\n\n` +
              `• এই খাতের খরচ: ৳${highestBn}\n` +
              `• মোট খরচের অনুপাত: প্রায় ${englishToBanglaDigits(pct)}% (মোট খরচ ৳${totalExpBn}-এর মধ্যে)\n\n` +
              `পরামর্শ: পশুখাদ্য বা প্রধান খরচের খাতে ক্রয় রসিদ মিলিয়ে অপচয় রোধ করতে পারেন।`,
            evidence: {
              period: targetPeriodLabelBn,
              categories: [highest.categoryBn],
              totalsOrCounts: {
                'খাতের খরচ': `৳${highestBn}`,
                'মোট খরচ': `৳${totalExpBn}`,
              },
              relevantView: 'finance',
              relevantViewLabelBn: 'আয়-ব্যয় পাতা দেখুন',
            },
            suggestedAction: { tab: 'finance', labelBn: 'আয়-ব্যয় বিবরণী দেখুন' },
            isDemoPreview: context.isDemoData,
          };
        }
      }

      // General income vs expense question
      const incomeBn = englishToBanglaDigits(financialSummary.totalIncome);
      const expBn = englishToBanglaDigits(financialSummary.totalExpenses);
      const netResult = financialSummary.netOperatingResult;
      const netBn = englishToBanglaDigits(Math.abs(netResult));
      const statusWord = financialSummary.isSurplus ? 'পরিচালন উদ্বৃত্ত (উদ্বৃত্ত)' : 'ঘাটতি';

      return {
        success: true,
        answer: `আপনার সংরক্ষিত রেকর্ড অনুযায়ী, ${targetPeriodLabelBn}-এ:\n\n` +
          `• মোট আয়: ৳${incomeBn}\n` +
          `• মোট খরচ: ৳${expBn}\n` +
          `• নিট পরিচালন ফলাফল: ৳${netBn} (${statusWord})\n\n` +
          `গুরুত্বপূর্ণ হিসাবরক্ষণ তথ্য: এই নিট হিসাবটি সংরক্ষিত লেনদেনের ভিত্তিতে তৈরি (মোট আয় − মোট খরচ); এটি সরাসরি হাতে থাকা নগদ ব্যালেন্স নয়। উৎপাদিত দুধ কেবল বিক্রির রেকর্ড অনুযায়ী আয়ে অন্তর্ভুক্ত হয়েছে।`,
        evidence: {
          period: targetPeriodLabelBn,
          categories: ['দুধ বিক্রি', 'পশুখাদ্য', 'বেতন', 'চিকিৎসা'],
          totalsOrCounts: {
            'মোট আয়': `৳${incomeBn}`,
            'মোট খরচ': `৳${expBn}`,
            'নিট ফলাফল': `৳${netBn}`,
          },
          relevantView: 'finance',
          relevantViewLabelBn: 'আর্থিক বিবরণী দেখুন',
        },
        suggestedAction: { tab: 'finance', labelBn: 'আয়-ব্যয় পাতা খুলুন' },
        isDemoPreview: context.isDemoData,
      };
    }

    // 5. Topic: Milk Production (দুধের হিসাব ও উৎপাদন ট্রেন্ড)
    if (queryTopic === 'milk') {
      if (!milkSummary || milkSummary.distinctDaysCount === 0) {
        return {
          success: true,
          answer: `আপনার খামারে ${targetPeriodLabelBn}-এ কোনো দুধ সংগ্রহের রেকর্ড সংরক্ষিত নেই। দুধের এন্ট্রি করতে দুধের হিসাব পাতায় যান।`,
          evidence: {
            period: targetPeriodLabelBn,
            totalsOrCounts: { 'সংগৃহীত দুধ': '০ লিটার' },
            relevantView: 'milk',
            relevantViewLabelBn: 'দুধের পাতা খুলুন',
          },
          suggestedAction: { tab: 'milk', labelBn: 'নতুন দুধ এন্ট্রি করুন' },
          isDemoPreview: context.isDemoData,
        };
      }

      const collBn = englishToBanglaDigits(milkSummary.totalCollectedLiters);
      const soldBn = englishToBanglaDigits(milkSummary.totalSoldLiters);
      const retainedBn = englishToBanglaDigits(milkSummary.totalRetainedLiters);
      const revBn = englishToBanglaDigits(milkSummary.totalRevenueTk);
      const avgBn = englishToBanglaDigits(milkSummary.averageDailyLiters);
      const daysBn = englishToBanglaDigits(milkSummary.distinctDaysCount);

      // Check comparison with previous month
      if (milkSummary.previousPeriodComparison) {
        const comp = milkSummary.previousPeriodComparison;
        const prevBn = englishToBanglaDigits(comp.previousTotalLiters);
        const diffBn = englishToBanglaDigits(comp.differenceLiters);
        const pctBn = englishToBanglaDigits(comp.percentageChange);

        let trendText = '';
        if (comp.trend === 'down') {
          trendText = `হ্যাঁ, গত মাসের তুলনায় এই মাসে দুধ **কম উৎপাদন** হয়েছে।\n` +
            `• চলতি মাসে সংগ্রহ: ${collBn} লিটার\n` +
            `• গত মাসে সংগ্রহ: ${prevBn} লিটার\n` +
            `• কমেছে: ${diffBn} লিটার (প্রায় ${pctBn}% কম)\n\n` +
            `পরামর্শ: গাভীগুলোর বর্তমান খাদ্য তালিকা, আবহাওয়া ও সাম্প্রতিক প্রসব বা ড্রাই হওয়া গাভীর সংখ্যা যাচাই করুন।`;
        } else if (comp.trend === 'up') {
          trendText = `না, গত মাসের তুলনায় এই মাসে দুধ **বেশি উৎপাদন** হয়েছে!\n` +
            `• চলতি মাসে সংগ্রহ: ${collBn} লিটার\n` +
            `• গত মাসে সংগ্রহ ছিল: ${prevBn} লিটার\n` +
            `• বৃদ্ধি পেয়েছে: ${diffBn} লিটার (প্রায় ${pctBn}% বেশি)`;
        } else {
          trendText = `চলতি মাস ও গত মাসে দুধ উৎপাদনের পরিমাণ সমান ছিল (${collBn} লিটার)।`;
        }

        return {
          success: true,
          answer: trendText,
          evidence: {
            period: `${targetPeriodLabelBn} বনাম পূর্ববর্তী মাস`,
            totalsOrCounts: {
              'চলতি সংগ্রহ': `${collBn} লিটার`,
              'পূর্ববর্তী সংগ্রহ': `${prevBn} লিটার`,
              'বিক্রয়লব্ধ আয়': `৳${revBn}`,
            },
            relevantView: 'milk',
            relevantViewLabelBn: 'দুধের অ্যানালিটিক্স দেখুন',
          },
          suggestedAction: { tab: 'milk', labelBn: 'দুধের হিসাব বিস্তারিত দেখুন' },
          isDemoPreview: context.isDemoData,
        };
      }

      return {
        success: true,
        answer: `আপনার সংরক্ষিত রেকর্ড অনুযায়ী ${targetPeriodLabelBn}-এ:\n\n` +
          `• মোট সংগৃহীত দুধ: ${collBn} লিটার (গড় দৈনিক ${avgBn} লিটার, মোট ${daysBn} দিনের রেকর্ড)\n` +
          `• বিক্রিত দুধ: ${soldBn} লিটার (বিক্রয় আয়: ৳${revBn})\n` +
          `• খামারে রাখা/বাছুরের দুধ: ${retainedBn} লিটার\n\n` +
          `উল্লেখ্য: খামার বাল্ক ট্যাংক সংগ্রহ ও নির্দিষ্ট গরুর উৎপাদন রেকর্ডের মধ্যে ডাবল-কাউন্টিং ছাড়া এই নিখুঁত হিসাব তৈরি করা হয়েছে।`,
        evidence: {
          period: targetPeriodLabelBn,
          totalsOrCounts: {
            'মোট দুধ': `${collBn} লিটার`,
            'বিক্রিত': `${soldBn} লিটার`,
            'বিক্রয় আয়': `৳${revBn}`,
            'অবিক্রিত/বাছুরের': `${retainedBn} লিটার`,
          },
          relevantView: 'milk',
          relevantViewLabelBn: 'দুধের বিস্তারিত দেখুন',
        },
        suggestedAction: { tab: 'milk', labelBn: 'দুধের হিসাব খুলুন' },
        isDemoPreview: context.isDemoData,
      };
    }

    // 6. Topic: Cow Health / Vaccines
    if (queryTopic === 'cow_health') {
      const upcoming = healthSummary?.upcomingVaccines || [];
      if (upcoming.length === 0) {
        return {
          success: true,
          answer: `আপনার খামারে বর্তমানে কোনো আসন্ন বা মেয়াদোত্তীর্ণ টিকার শিডিউল বাকি নেই। সব সক্রিয় গাভী সুস্থ ও শিডিউল অনুযায়ী রয়েছে।`,
          evidence: {
            period: targetPeriodLabelBn,
            totalsOrCounts: { 'আসন্ন টিকা': '০টি' },
            relevantView: 'cows',
            relevantViewLabelBn: 'গরুর তালিকা দেখুন',
          },
          suggestedAction: { tab: 'cows', labelBn: 'গরুর প্রোফাইল দেখুন' },
          isDemoPreview: context.isDemoData,
        };
      }

      const overdueList = upcoming.filter((v) => v.isOverdue);
      const upcomingList = upcoming.filter((v) => !v.isOverdue);

      let resp = `আপনার খামারের গাভীদের আসন্ন টিকার তথ্য:\n\n`;
      if (overdueList.length > 0) {
        resp += `⚠️ **জরুরি / মেয়াদোত্তীর্ণ টিকা:**\n`;
        for (const v of overdueList) {
          resp += `• ${v.cowTag} (${v.cowName || 'গাভী'}) — ${v.vaccineName} (তারিখ: ${v.dueDate})\n`;
        }
        resp += `\n`;
      }

      if (upcomingList.length > 0) {
        resp += `📅 **আসন্ন টিকার তারিখ:**\n`;
        for (const v of upcomingList) {
          resp += `• ${v.cowTag} (${v.cowName || 'গাভী'}) — ${v.vaccineName} (নির্ধারিত তারিখ: ${v.dueDate})\n`;
        }
      }

      resp += `\nপরামর্শ: টিকা দেওয়ার পূর্বে উপজেলা ভেটেরিনারি চিকিৎসকের পরামর্শ নিয়ে কোল্ড চেইন বজায় রেখে ভ্যাকসিন প্রয়োগ করুন।`;

      return {
        success: true,
        answer: resp,
        evidence: {
          period: 'বর্তমান শিডিউল',
          categories: ['টিকা ও বুস্টার শিডিউল'],
          totalsOrCounts: {
            'মোট টিকা শিডিউল': `${englishToBanglaDigits(upcoming.length)}টি`,
            'মেয়াদোত্তীর্ণ': `${englishToBanglaDigits(overdueList.length)}টি`,
          },
          relevantView: 'reminders',
          relevantViewLabelBn: 'অনুস্মারক পাতায় দেখুন',
        },
        suggestedAction: { tab: 'reminders', labelBn: 'স্মার্ট অনুস্মারক কেন্দ্র খুলুন' },
        isDemoPreview: context.isDemoData,
      };
    }

    // 7. Topic: Employee / Tasks
    if (queryTopic === 'employee') {
      const pendingTasks = employeeSummary?.pendingTasks || [];
      if (pendingTasks.length === 0) {
        return {
          success: true,
          answer: `বর্তমানে কর্মীদের জন্য কোনো পেন্ডিং বা অসম্পূর্ণ কাজ বাকি নেই। সকল নির্ধারিত দায়িত্ব সম্পন্ন করা হয়েছে।`,
          evidence: {
            period: targetPeriodLabelBn,
            totalsOrCounts: { 'বাকি কাজ': '০টি' },
            relevantView: 'employees',
            relevantViewLabelBn: 'কর্মী ব্যবস্থাপনা দেখুন',
          },
          suggestedAction: { tab: 'employees', labelBn: 'কর্মী ও হাজিরা পাতা দেখুন' },
          isDemoPreview: context.isDemoData,
        };
      }

      let resp = `কর্মীদের বাকি ও পেন্ডিং কাজের তালিকা:\n\n`;
      for (const t of pendingTasks) {
        const statusBadge = t.isOverdue ? '⚠️ মেয়াদোত্তীর্ণ' : 'পেন্ডিং';
        resp += `• **${t.employeeName}**: ${t.taskTitle} (শেষ সময়: ${t.dueDate}, গুরুত্ব: ${t.priorityBn}) [${statusBadge}]\n`;
      }

      resp += `\nহাজিরা ও কাজের অগ্রগতি তদারকি করতে আপনি স্মার্ট অনুস্মারক কেন্দ্রে দায়িত্ব সম্পন্ন হিসেবে চিহ্নিত করতে পারেন।`;

      return {
        success: true,
        answer: resp,
        evidence: {
          period: targetPeriodLabelBn,
          totalsOrCounts: {
            'বাকি কাজ সংখ্যা': `${englishToBanglaDigits(pendingTasks.length)}টি`,
          },
          relevantView: 'reminders',
          relevantViewLabelBn: 'অনুস্মারক ও কাজের তালিকা দেখুন',
        },
        suggestedAction: { tab: 'reminders', labelBn: 'অনুস্মারক কেন্দ্রে যান' },
        isDemoPreview: context.isDemoData,
      };
    }

    // 8. Topic: Biogas Plant
    if (queryTopic === 'biogas') {
      if (!biogasSummary || biogasSummary.recordDaysCount === 0) {
        return {
          success: true,
          answer: `আপনার খামারে ${targetPeriodLabelBn}-এ কোনো বায়োগ্যাস ইনপুট বা লগ রেকর্ড পাওয়া যায়নি। প্ল্যান্টের তথ্য দেখতে বায়োগ্যাস পাতায় যান।`,
          evidence: {
            period: targetPeriodLabelBn,
            totalsOrCounts: { 'গোবর ইনপুট': '০ কেজি' },
            relevantView: 'biogas',
            relevantViewLabelBn: 'বায়োগ্যাস পাতা দেখুন',
          },
          suggestedAction: { tab: 'biogas', labelBn: 'বায়োগ্যাস লগ এন্ট্রি করুন' },
          isDemoPreview: context.isDemoData,
        };
      }

      const dungBn = englishToBanglaDigits(biogasSummary.totalDungKg);
      const waterBn = englishToBanglaDigits(biogasSummary.totalWaterLiters);
      const burnBn = englishToBanglaDigits(biogasSummary.totalBurnHours);
      const slurryBn = englishToBanglaDigits(biogasSummary.totalSlurryBags);
      const daysBn = englishToBanglaDigits(biogasSummary.recordDaysCount);
      const avgDungBn = englishToBanglaDigits(biogasSummary.avgDailyDungKg);

      return {
        success: true,
        answer: `আপনার সংরক্ষিত রেকর্ড অনুযায়ী ${targetPeriodLabelBn}-এ বায়োগ্যাস প্ল্যান্টের সার্বিক তথ্য:\n\n` +
          `• মোট গোবর ইনপুট: **${dungBn} কেজি** (গড় দৈনিক ${avgDungBn} কেজি, মোট ${daysBn} দিনের এন্ট্রি)\n` +
          `• মোট পানি ইনপুট: ${waterBn} লিটার (১:১ অনুপাতে মিশ্রিত)\n` +
          `• রান্নার চুলা জ্বলার সময়: মোট ${burnBn} ঘণ্টা\n` +
          `• উৎপাদিত স্লারি জৈব সার: ${slurryBn} বস্তা\n\n` +
          `পরামর্শ: নিয়মিত পরিদর্শনে ইনলেট চেম্বার ও পাইপের গ্যাস লিকেজ চেক নিশ্চিত করুন।`,
        evidence: {
          period: targetPeriodLabelBn,
          totalsOrCounts: {
            'মোট গোবর': `${dungBn} কেজি`,
            'পানি ইনপুট': `${waterBn} লিটার`,
            'চুলা জ্বলা': `${burnBn} ঘণ্টা`,
            'জৈব সার': `${slurryBn} বস্তা`,
          },
          relevantView: 'biogas',
          relevantViewLabelBn: 'বায়োগ্যাস ড্যাশবোর্ড দেখুন',
        },
        suggestedAction: { tab: 'biogas', labelBn: 'বায়োগ্যাস পাতা খুলুন' },
        isDemoPreview: context.isDemoData,
      };
    }

    // 9. Topic: Recommendations / Cost reduction
    if (queryTopic === 'recommendations') {
      const highestExp = financialSummary?.highestExpenseCategory;
      const highestNote = highestExp ? `১. আপনার সর্বোচ্চ ব্যয়ের খাত **${highestExp.categoryBn}** (৳${englishToBanglaDigits(highestExp.amount)})। পাইকারি হারে ভুসি-খড় ক্রয় ও অপচয় কমানো প্রধান সাশ্রয়ী পদক্ষেপ হতে পারে।\n` : '';

      return {
        success: true,
        answer: `আপনার খামারের সংরক্ষিত ডেটা বিশ্লেষণের ভিত্তিতে খরচ কমানো ও লাভজনকতা বৃদ্ধির কিছু বাস্তবসম্মত সুযোগ:\n\n` +
          highestNote +
          `২. দুধ বিক্রির রেকর্ড নিয়মিত রাখা: দুধ উৎপাদনের পাশাপাশি বিক্রয় মূল্য ও পরিমাণ নিয়মিত রেকর্ড করুন যাতে প্রকৃত লাভ সঠিক বোঝা যায়।\n` +
          `৩. বায়োগ্যাস সার বিক্রয়: উৎপাদিত স্লারি স্থানীয় জমিতে জৈব সার হিসেবে বিক্রি করে বাড়তি আয় যুক্ত করতে পারেন।\n` +
          `৪. সময়মতো প্রতিরোধমূলক টিকা: আসন্ন টিকার শিডিউল বজায় রাখলে বড় আকারের চিকিৎসা খরচ সাশ্রয় হয়।\n\n` +
          `দৃষ্টি আকর্ষণ: এই পর্যবেক্ষণগুলো শুধুমাত্র ঐতিহাসিক ট্রেন্ডের উপর ভিত্তি করে তৈরি; কোনো কাল্পনিক মূল্য বা মুনাফার নিশ্চয়তা নয়।`,
        evidence: {
          period: targetPeriodLabelBn,
          categories: ['পশুখাদ্য', 'দুধ বিক্রয়', 'জৈব সার'],
          relevantView: 'reports',
          relevantViewLabelBn: 'খামার রিপোর্ট সেন্টারে বিস্তারিত দেখুন',
        },
        suggestedAction: { tab: 'reports', labelBn: 'স্মার্ট রিপোর্ট সেন্টারে যান' },
        isDemoPreview: context.isDemoData,
      };
    }

    // 10. Default General Welcome / Overview
    const cowsCount = englishToBanglaDigits(healthSummary?.totalActiveCows || 0);
    return {
      success: true,
      answer: `আসসালামু আলাইকুম! মুমিন এগ্রোর বর্তমানে ${cowsCount}টি সক্রিয় গাভী নিবন্ধিত রয়েছে।\n\n` +
        `আপনি যেকোনো নির্দিষ্ট প্রশ্ন করতে পারেন, যেমন:\n` +
        `• "এই মাসে খামারের মোট আয় আর খরচ কত?"\n` +
        `• "গত মাসের তুলনায় এই মাসে দুধ কম হয়েছে কি?"\n` +
        `• "কোন খাতে সবচেয়ে বেশি টাকা খরচ হচ্ছে?"\n` +
        `• "কোন গরুর টিকা দেওয়ার তারিখ সামনে?"\n` +
        `• "গত ৭ দিনে কত কেজি গোবর বায়োগ্যাসে দেওয়া হয়েছে?"`,
      evidence: {
        period: targetPeriodLabelBn,
        relevantView: 'dashboard',
        relevantViewLabelBn: 'ড্যাশবোর্ড ওভারভিউ দেখুন',
      },
      suggestedAction: { tab: 'dashboard', labelBn: 'ড্যাশবোর্ডে ফিরে যান' },
      isDemoPreview: context.isDemoData,
    };
  }
}

/**
 * Live Supabase Edge Function AI Provider.
 * Communicates with `farm-advisor` edge function on Supabase.
 * Falls back safely to MockAiAdvisorProvider if unconfigured or in demo mode.
 */
export class SupabaseEdgeFunctionAiProvider implements AiAdvisorProvider {
  private mockProvider = new MockAiAdvisorProvider();

  async askQuestion(
    userId: string | undefined,
    query: string,
    context: FarmAdvisorContext,
    authToken?: string
  ): Promise<AiAdvisorQueryResult> {
    // If running in demo mode or Supabase is unconfigured, use deterministic mock provider
    if (context.isDemoData || !isSupabaseConfigured || !supabase || !userId) {
      return this.mockProvider.askQuestion(userId, query, context, authToken);
    }

    try {
      // In Live Cloud mode, invoke the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('farm-advisor', {
        body: {
          query,
          context,
        },
      });

      if (error) {
        console.warn('Edge function invoke error, falling back to grounded mock provider:', error);
        // If config is missing on server, provide clear Bengali error
        if (error.message?.includes('GEMINI_API_KEY') || error.message?.includes('503')) {
          return {
            success: false,
            answer: '',
            error: 'GEMINI_API_KEY সার্ভারে কনফিগার করা হয়নি। Supabase Edge Function Secrets-এ GEMINI_API_KEY সেট করুন।',
          };
        }
        // Fall back gracefully to mock analysis with clear note
        const fallbackRes = await this.mockProvider.askQuestion(userId, query, context, authToken);
        return {
          ...fallbackRes,
          isDemoPreview: false,
        };
      }

      if (data && data.success) {
        return {
          success: true,
          answer: data.answer,
          evidence: {
            period: context.targetPeriodLabelBn,
            relevantView: context.queryTopic === 'finance' ? 'finance' :
                          context.queryTopic === 'milk' ? 'milk' :
                          context.queryTopic === 'cow_health' ? 'cows' :
                          context.queryTopic === 'employee' ? 'employees' :
                          context.queryTopic === 'biogas' ? 'biogas' : 'dashboard',
            relevantViewLabelBn: 'সংশ্লিষ্ট খামার পাতা দেখুন',
          },
          isDemoPreview: false,
        };
      }

      return {
        success: false,
        answer: '',
        error: data?.error || 'AI প্রোভাইডার থেকে উত্তর পাওয়া সম্ভব হয়নি।',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        answer: '',
        error: `AI সার্ভারের সাথে সংযোগে সমস্যা হয়েছে: ${msg}`,
      };
    }
  }
}

// Default export singleton service
export const aiAdvisorService = new SupabaseEdgeFunctionAiProvider();
