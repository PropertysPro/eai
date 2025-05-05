// Cross-platform storage utility for React Native + Web
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = typeof window !== 'undefined' && !!window.localStorage;

export const crossStorage = {
  async setItem(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
    if (isWeb) {
      try {
        window.localStorage.setItem(key, value);
      } catch {}
    }
  },
  async getItem(key: string): Promise<string | null> {
    let value = null;
    try {
      value = await AsyncStorage.getItem(key);
    } catch {}
    if ((!value || value === 'null') && isWeb) {
      try {
        value = window.localStorage.getItem(key);
      } catch {}
    }
    return value;
  },
  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
    if (isWeb) {
      try {
        window.localStorage.removeItem(key);
      } catch {}
    }
  }
};
