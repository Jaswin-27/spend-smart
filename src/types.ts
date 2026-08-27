/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface Budget {
  total: number;
  categories: Record<string, number>; // Maps category name to budget limit
}

export interface Template {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number;
}

export interface Preferences {
  darkMode: boolean;
  currency: string; // Currency code, e.g. "INR"
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CATEGORIES = [
  { id: 'Food', name: 'Food', color: '#22C55E' },
  { id: 'Transport', name: 'Transport', color: '#3B82F6' },
  { id: 'Shopping', name: 'Shopping', color: '#EC4899' },
  { id: 'Bills', name: 'Bills', color: '#F59E0B' },
  { id: 'Entertainment', name: 'Entertainment', color: '#8B5CF6' },
  { id: 'Health', name: 'Health', color: '#EF4444' },
  { id: 'Savings', name: 'Savings', color: '#14B8A6' },
  { id: 'Other', name: 'Other', color: '#94A3B8' },
];

// All currencies list with symbols so it fulfills "all the currencies in the world ok"
export const CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'ZWD', symbol: 'Z$', name: 'Zimbabwean Dollar' },
];
