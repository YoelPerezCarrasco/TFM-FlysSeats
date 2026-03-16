import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Booking {
  id: string;
  userId: string;
  flight?: any;
  bookingNumber?: string;
  passengerName?: string;
  seatNumber?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: Date | string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly API_URL = `${environment.apiUrl}/bookings`;
  private readonly CACHE_KEY = 'user_bookings';

  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private authService: AuthService
  ) { }

  getMyBookings(): Observable<Booking[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const cached = this.cacheService.get<Booking[]>(this.CACHE_KEY);
    
    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    return this.http.get<{ bookings: Booking[] }>(`${this.API_URL}/${currentUser.id}`).pipe(
      map((response) => response.bookings || []),
      tap(bookings => this.cacheService.set(this.CACHE_KEY, bookings))
    );
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/${id}`);
  }

  createBooking(flight: any): Observable<{ message: string; bookingId: string }> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      throw new Error('Usuario no autenticado');
    }

    return this.http.post<{ message: string; bookingId: string }>(this.API_URL, {
      userId: currentUser.id,
      flight
    }).pipe(
      tap(() => this.cacheService.remove(this.CACHE_KEY))
    );
  }

  cancelBooking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.cacheService.remove(this.CACHE_KEY))
    );
  }
}
