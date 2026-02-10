import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  constructor() { }

  set(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to sessionStorage', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      console.error('Error reading from sessionStorage', error);
      return null;
    }
  }

  remove(key: string): void {
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }

  has(key: string): boolean {
    return sessionStorage.getItem(key) !== null;
  }
}
