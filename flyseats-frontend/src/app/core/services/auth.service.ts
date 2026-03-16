import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  token?: string;
}

interface LoginResponse {
  message?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly AUTH_KEY = 'auth_user';
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) {
    this.loadUserFromCache();
  }

  private loadUserFromCache(): void {
    const cachedUser = this.cacheService.get<User | LoginResponse>(this.AUTH_KEY);
    if (cachedUser) {
      const normalized = (cachedUser as LoginResponse)?.user || (cachedUser as User);
      if (normalized?.id) {
        this.currentUserSubject.next(normalized);
      }
    }
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<User | LoginResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      map((response) => (response as LoginResponse)?.user || (response as User)),
      tap(user => {
        this.cacheService.set(this.AUTH_KEY, user);
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    this.cacheService.remove(this.AUTH_KEY);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    const user = this.getCurrentUser();
    return user?.token || null;
  }
}
