/**
 * Bengali Date and Number Utilities
 */

const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const bengaliMonths = [
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

export function toBengaliNumber(num: number | string): string {
  return num
    .toString()
    .replace(/[0-9]/g, (match) => bengaliDigits[parseInt(match, 10)]);
}

export function getTodayBengaliDate(): string {
  const now = new Date();
  const day = toBengaliNumber(now.getDate());
  const month = bengaliMonths[now.getMonth()];
  const year = toBengaliNumber(now.getFullYear());
  return `${day} ${month} ${year}`;
}
