import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanItem, User } from './context/AppContext';

const USER_KEY = 'hfi:user';
const SCANS_KEY = 'hfi:scans';

export async function loadUser(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUser(user: User | null) {
  try {
    if (!user) return AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export async function loadScans(): Promise<ScanItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SCANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveScans(scans: ScanItem[]) {
  try {
    await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(scans));
  } catch {}
}
