import { describe, it, expect } from 'vitest';
import { 
  getLiveBanglaDateTime, 
  convertToBanglaCalendar, 
  getBanglaPeriod, 
  isGregorianLeapYear 
} from '../banglaDateTime';

describe('Real-Time Bangla Date & Time Utility', () => {
  it('correctly calculates Bengali Calendar for October 10, 2026', () => {
    const testDate = new Date(2026, 9, 10, 14, 30, 0); // October 10, 2026 (Saturday)
    const banglaCal = convertToBanglaCalendar(testDate);
    expect(banglaCal.day).toBe(25);
    expect(banglaCal.monthName).toBe('আশ্বিন');
    expect(banglaCal.year).toBe(1433);
  });

  it('correctly calculates Bengali Calendar for October 11, 2026', () => {
    const testDate = new Date(2026, 9, 11, 1, 15, 0); // October 11, 2026 (Sunday)
    const banglaCal = convertToBanglaCalendar(testDate);
    expect(banglaCal.day).toBe(26);
    expect(banglaCal.monthName).toBe('আশ্বিন');
    expect(banglaCal.year).toBe(1433);
  });

  it('correctly calculates Bengali New Year (১ বৈশাখ) on April 14', () => {
    const testDate = new Date(2026, 3, 14, 9, 0, 0); // April 14, 2026
    const banglaCal = convertToBanglaCalendar(testDate);
    expect(banglaCal.day).toBe(1);
    expect(banglaCal.monthName).toBe('বৈশাখ');
    expect(banglaCal.year).toBe(1433);
  });

  it('correctly identifies Bengali periods of day', () => {
    expect(getBanglaPeriod(5)).toBe('ভোর');
    expect(getBanglaPeriod(8)).toBe('সকাল');
    expect(getBanglaPeriod(13)).toBe('দুপুর');
    expect(getBanglaPeriod(16)).toBe('বিকাল');
    expect(getBanglaPeriod(19)).toBe('সন্ধ্যা');
    expect(getBanglaPeriod(22)).toBe('রাত');
    expect(getBanglaPeriod(1)).toBe('রাত');
  });

  it('correctly formats live Bengali datetime output', () => {
    const testDate = new Date(2026, 9, 11, 7, 15, 30); // 7:15:30 AM
    const res = getLiveBanglaDateTime(testDate);

    expect(res.dayNameBn).toBe('রবিবার');
    expect(res.gregorianDateBn).toBe('১১ অক্টোবর ২০২৬');
    expect(res.banglaCalendarDateBn).toBe('২৬ আশ্বিন ১৪৩৩ বঙ্গাব্দ');
    expect(res.periodBn).toBe('সকাল');
    expect(res.time12Bn).toBe('০৭:১৫:৩০');
    expect(res.timeWithPeriodBn).toBe('সকাল ০৭:১৫:৩০');
  });

  it('identifies leap years accurately', () => {
    expect(isGregorianLeapYear(2024)).toBe(true);
    expect(isGregorianLeapYear(2026)).toBe(false);
    expect(isGregorianLeapYear(2000)).toBe(true);
    expect(isGregorianLeapYear(1900)).toBe(false);
  });
});
