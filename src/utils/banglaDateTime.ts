import { useEffect, useState } from 'react';
import { englishToBanglaDigits } from './accounting';

export interface BanglaDateTimeInfo {
  date: Date;
  // Day of week e.g. "রবিবার"
  dayNameBn: string;
  // Gregorian date formatted in Bengali e.g. "১১ অক্টোবর ২০২৬"
  gregorianDateBn: string;
  // Combined day and Gregorian date e.g. "রবিবার, ১১ অক্টোবর ২০২৬"
  fullGregorianDateBn: string;
  // Bengali calendar date e.g. "২৬ আশ্বিন ১৪৩৩ বঙ্গাব্দ"
  banglaCalendarDateBn: string;
  // Time period e.g. "রাত", "সকাল", "দুপুর", "বিকাল", "সন্ধ্যা"
  periodBn: string;
  // 12-hour formatted time in Bangla e.g. "০১:২৫:৪০"
  time12Bn: string;
  // Time with period e.g. "রাত ০১:২৫:৪০"
  timeWithPeriodBn: string;
  // Short time without seconds e.g. "রাত ০১:২৫"
  shortTimeBn: string;
}

const BANGLA_DAYS = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

const GREGORIAN_MONTHS_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const BANGLA_MONTHS_INFO = [
  { name: 'বৈশাখ', days: 31 },
  { name: 'জ্যৈষ্ঠ', days: 31 },
  { name: 'আষাঢ়', days: 31 },
  { name: 'শ্রাবণ', days: 31 },
  { name: 'ভাদ্র', days: 31 },
  { name: 'আশ্বিন', days: 31 },
  { name: 'কার্তিক', days: 30 },
  { name: 'অগ্রহায়ণ', days: 30 },
  { name: 'পৌষ', days: 30 },
  { name: 'মাঘ', days: 30 },
  { name: 'ফাল্গুন', days: 29 }, // 30 in leap year
  { name: 'চৈত্র', days: 30 },
];

/**
 * Checks if a Gregorian year is a leap year.
 */
export const isGregorianLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Converts a Gregorian Date to Bangladesh's official Bangla Academy revised calendar.
 * In Bangladesh:
 * - New Year (১ বৈশাখ) is always 14 April.
 * - Months 1-6 (বৈশাখ to আশ্বিন) have 31 days.
 * - Months 7-11 (কার্তিক to ফাল্গুন) have 30 days (ফাল্গুন 31 in leap year).
 * - Month 12 (চৈত্র) has 30 days.
 */
export const convertToBanglaCalendar = (date: Date): { day: number; monthName: string; year: number } => {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth(); // 0-11
  const gDate = date.getDate();

  const isLeap = isGregorianLeapYear(gYear);

  // Bengali month boundaries from April 14
  // Mapping date offsets
  let bDay = 1;
  let bMonthIndex = 0;
  let bYear = gMonth < 3 || (gMonth === 3 && gDate < 14) ? gYear - 594 : gYear - 593;

  // Calculate day difference from April 14
  if (gMonth === 3) { // April
    if (gDate >= 14) {
      bMonthIndex = 0; // বৈশাখ
      bDay = gDate - 13;
    } else {
      bMonthIndex = 11; // চৈত্র
      bDay = gDate + 17;
    }
  } else if (gMonth === 4) { // May
    if (gDate <= 14) {
      bMonthIndex = 0; // বৈশাখ
      bDay = gDate + 17;
    } else {
      bMonthIndex = 1; // জ্যৈষ্ঠ
      bDay = gDate - 14;
    }
  } else if (gMonth === 5) { // June
    if (gDate <= 14) {
      bMonthIndex = 1; // জ্যৈষ্ঠ
      bDay = gDate + 17;
    } else {
      bMonthIndex = 2; // আষাঢ়
      bDay = gDate - 14;
    }
  } else if (gMonth === 6) { // July
    if (gDate <= 15) {
      bMonthIndex = 2; // আষাঢ়
      bDay = gDate + 16;
    } else {
      bMonthIndex = 3; // শ্রাবণ
      bDay = gDate - 15;
    }
  } else if (gMonth === 7) { // August
    if (gDate <= 15) {
      bMonthIndex = 3; // শ্রাবণ
      bDay = gDate + 16;
    } else {
      bMonthIndex = 4; // ভাদ্র
      bDay = gDate - 15;
    }
  } else if (gMonth === 8) { // September
    if (gDate <= 15) {
      bMonthIndex = 4; // ভাদ্র
      bDay = gDate + 16;
    } else {
      bMonthIndex = 5; // আশ্বিন
      bDay = gDate - 15;
    }
  } else if (gMonth === 9) { // October
    if (gDate <= 16) {
      bMonthIndex = 5; // আশ্বিন
      bDay = gDate + 15;
    } else {
      bMonthIndex = 6; // কার্তিক
      bDay = gDate - 16;
    }
  } else if (gMonth === 10) { // November
    if (gDate <= 15) {
      bMonthIndex = 6; // কার্তিক
      bDay = gDate + 15;
    } else {
      bMonthIndex = 7; // অগ্রহায়ণ
      bDay = gDate - 15;
    }
  } else if (gMonth === 11) { // December
    if (gDate <= 15) {
      bMonthIndex = 7; // অগ্রহায়ণ
      bDay = gDate + 15;
    } else {
      bMonthIndex = 8; // পৌষ
      bDay = gDate - 15;
    }
  } else if (gMonth === 0) { // January
    if (gDate <= 14) {
      bMonthIndex = 8; // পৌষ
      bDay = gDate + 16;
    } else {
      bMonthIndex = 9; // মাঘ
      bDay = gDate - 14;
    }
  } else if (gMonth === 1) { // February
    if (gDate <= 13) {
      bMonthIndex = 9; // মাঘ
      bDay = gDate + 17;
    } else {
      bMonthIndex = 10; // ফাল্গুন
      bDay = gDate - 13;
    }
  } else if (gMonth === 2) { // March
    const falgunCutoff = 14;
    if (gDate <= falgunCutoff) {
      bMonthIndex = 10; // ফাল্গুন
      bDay = gDate + (isLeap ? 16 : 15);
    } else {
      bMonthIndex = 11; // চৈত্র
      bDay = gDate - falgunCutoff;
    }
  }

  const monthName = BANGLA_MONTHS_INFO[bMonthIndex]?.name || 'বৈশাখ';
  return { day: bDay, monthName, year: bYear };
};

/**
 * Returns Bengali time of day period.
 */
export const getBanglaPeriod = (hours24: number): string => {
  if (hours24 >= 4 && hours24 < 6) return 'ভোর';
  if (hours24 >= 6 && hours24 < 12) return 'সকাল';
  if (hours24 >= 12 && hours24 < 15) return 'দুপুর';
  if (hours24 >= 15 && hours24 < 18) return 'বিকাল';
  if (hours24 >= 18 && hours24 < 20) return 'সন্ধ্যা';
  return 'রাত';
};

/**
 * Formats full real-time date and time in Bengali.
 */
export const getLiveBanglaDateTime = (now: Date = new Date()): BanglaDateTimeInfo => {
  const dayNameBn = BANGLA_DAYS[now.getDay()];
  const gDayBn = englishToBanglaDigits(now.getDate());
  const gMonthBn = GREGORIAN_MONTHS_BN[now.getMonth()];
  const gYearBn = englishToBanglaDigits(now.getFullYear());

  const gregorianDateBn = `${gDayBn} ${gMonthBn} ${gYearBn}`;
  const fullGregorianDateBn = `${dayNameBn}, ${gregorianDateBn}`;

  // Bengali Calendar
  const banglaCal = convertToBanglaCalendar(now);
  const banglaCalendarDateBn = `${englishToBanglaDigits(banglaCal.day)} ${banglaCal.monthName} ${englishToBanglaDigits(banglaCal.year)} বঙ্গাব্দ`;

  // Time
  const hours24 = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const periodBn = getBanglaPeriod(hours24);
  const hours12 = hours24 % 12 || 12;

  const hStr = englishToBanglaDigits(String(hours12).padStart(2, '0'));
  const mStr = englishToBanglaDigits(String(minutes).padStart(2, '0'));
  const sStr = englishToBanglaDigits(String(seconds).padStart(2, '0'));

  const time12Bn = `${hStr}:${mStr}:${sStr}`;
  const timeWithPeriodBn = `${periodBn} ${time12Bn}`;
  const shortTimeBn = `${periodBn} ${hStr}:${mStr}`;

  return {
    date: now,
    dayNameBn,
    gregorianDateBn,
    fullGregorianDateBn,
    banglaCalendarDateBn,
    periodBn,
    time12Bn,
    timeWithPeriodBn,
    shortTimeBn,
  };
};

/**
 * Custom React Hook that returns ticking real-time Bengali date and time.
 */
export const useLiveBanglaClock = (): BanglaDateTimeInfo => {
  const [dateTime, setDateTime] = useState<BanglaDateTimeInfo>(() => getLiveBanglaDateTime());

  useEffect(() => {
    // Immediate sync
    setDateTime(getLiveBanglaDateTime());

    const timer = setInterval(() => {
      setDateTime(getLiveBanglaDateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return dateTime;
};
