const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function yearKey(date: Date): string {
  return String(date.getFullYear());
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${HEBREW_MONTHS[month - 1]} ${year}`;
}

export function previousMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 2, 1);
  return monthKey(date);
}

export function previousYearKey(key: string): string {
  return String(Number(key) - 1);
}

export function isDateInMonth(date: Date, key: string): boolean {
  return monthKey(date) === key;
}

export function isDateInYear(date: Date, key: string): boolean {
  return yearKey(date) === key;
}
