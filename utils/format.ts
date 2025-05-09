import { useCurrencyStore, SupportedCurrency, getCurrencySymbol } from '@/store/currency-store';

export const formatPrice = (
  price: number | null | undefined, 
  targetCurrency?: SupportedCurrency,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  if (price === null || price === undefined) {
    return 'N/A'; // Or some other placeholder for undefined prices
  }

  const globalCurrency = useCurrencyStore.getState().currentCurrency;
  const currencyToUse = targetCurrency || globalCurrency;
  
  // The Intl.NumberFormat 'currency' style often adds the currency code (e.g., AED, USD)
  // which might be redundant if we also want to use a symbol.
  // For more control, we can format as a decimal and prepend the symbol.

  const defaultFractionDigits = currencyToUse === 'AED' ? 0 : 2; // Example: AED usually has 0, others 2

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal', // Change to decimal to avoid double currency indicators
    minimumFractionDigits: options?.minimumFractionDigits ?? defaultFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits ?? defaultFractionDigits,
  });

  const formattedPrice = formatter.format(price);
  const symbol = getCurrencySymbol(currencyToUse);

  // Place symbol according to common conventions (can be made more robust)
  // For USD, EUR, GBP, symbol comes before. For AED, INR, often after or as code.
  // For simplicity, we'll use the code for AED and symbol before for others.
  if (currencyToUse === 'AED') {
    return `${formattedPrice} ${symbol}`;
  }
  return `${symbol}${formattedPrice}`;
};
