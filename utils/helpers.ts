import { Platform } from 'react-native';

/**
 * Format a timestamp into a human-readable string
 * @param timestamp ISO string or timestamp number
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: string | number): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isThisYear = date.getFullYear() === now.getFullYear();
  
  // Format time (used for today's messages)
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
  
  // For messages from today, just show the time
  if (isToday) {
    return timeString;
  }
  
  // For messages from this year, show month and day
  if (isThisYear) {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}, ${timeString}`;
  }
  
  // For older messages, show month, day, and year
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}, ${timeString}`;
};

/**
 * Format a price number to a currency string
 * @param price Number to format
 * @param currency Currency code (default: USD)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Format a number with commas
 * @param num Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Truncate text to a specified length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from a name
 * @param name Full name
 * @returns Initials (up to 2 characters)
 */
export const getInitials = (name: string): string => {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Check if the device is using iOS
 * @returns Boolean indicating if the device is iOS
 */
export const isIOS = (): boolean => {
  return Platform.OS === 'ios';
};

/**
 * Check if the device is using Android
 * @returns Boolean indicating if the device is Android
 */
export const isAndroid = (): boolean => {
  return Platform.OS === 'android';
};

/**
 * Check if the app is running on web
 * @returns Boolean indicating if the app is running on web
 */
export const isWeb = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Generate a random ID
 * @param prefix Optional prefix for the ID
 * @returns Random ID string
 */
export const generateId = (prefix = ''): string => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Delay execution for a specified time
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Capitalize the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format a date to a readable string
 * @param date Date object or string
 * @param format Format string (default: 'MMM D, YYYY')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, format = 'MMM D, YYYY'): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Replace tokens in format string
  return format
    .replace('MMM', months[month])
    .replace('MM', (month + 1).toString().padStart(2, '0'))
    .replace('M', (month + 1).toString())
    .replace('D', day.toString())
    .replace('DD', day.toString().padStart(2, '0'))
    .replace('YYYY', year.toString())
    .replace('YY', year.toString().slice(-2));
};