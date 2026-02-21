export interface Currency {
  code: string
  name: string
  symbol: string
  locale: string
}

export const CURRENCIES: Currency[] = [
  // Major World Currencies
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" },
  { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", locale: "de-CH" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", locale: "en-CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", locale: "en-AU" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", locale: "en-NZ" },

  // MENA Region
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", locale: "fr-MA" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", locale: "ar-AE" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", locale: "ar-SA" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", locale: "ar-EG" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", locale: "ar-KW" },
  { code: "QAR", name: "Qatari Riyal", symbol: "﷼", locale: "ar-QA" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", locale: "ar-BH" },
  { code: "OMR", name: "Omani Rial", symbol: "﷼", locale: "ar-OM" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", locale: "ar-TN" },
  { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", locale: "ar-DZ" },

  // Asia
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", locale: "ko-KR" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", locale: "en-SG" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", locale: "zh-HK" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", locale: "zh-TW" },
  { code: "THB", name: "Thai Baht", symbol: "฿", locale: "th-TH" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", locale: "ms-MY" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", locale: "id-ID" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", locale: "en-PH" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", locale: "vi-VN" },

  // Americas
  { code: "BRL", name: "Brazilian Real", symbol: "R$", locale: "pt-BR" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$", locale: "es-MX" },
  { code: "ARS", name: "Argentine Peso", symbol: "AR$", locale: "es-AR" },
  { code: "CLP", name: "Chilean Peso", symbol: "CL$", locale: "es-CL" },
  { code: "COP", name: "Colombian Peso", symbol: "CO$", locale: "es-CO" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/", locale: "es-PE" },

  // Europe
  { code: "SEK", name: "Swedish Krona", symbol: "kr", locale: "sv-SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", locale: "nb-NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", locale: "da-DK" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", locale: "pl-PL" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", locale: "cs-CZ" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", locale: "hu-HU" },
  { code: "RON", name: "Romanian Leu", symbol: "lei", locale: "ro-RO" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", locale: "tr-TR" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽", locale: "ru-RU" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", locale: "uk-UA" },

  // Africa
  { code: "ZAR", name: "South African Rand", symbol: "R", locale: "en-ZA" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", locale: "en-NG" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", locale: "en-KE" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", locale: "en-GH" },

  // Other
  { code: "ILS", name: "Israeli Shekel", symbol: "₪", locale: "he-IL" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", locale: "ur-PK" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", locale: "bn-BD" },
]

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code)
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyByCode(code)?.symbol || code
}

export function getCurrencyLocale(code: string): string {
  return getCurrencyByCode(code)?.locale || "en-US"
}
