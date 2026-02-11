import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { environment } from '../../../environments/environment';

export interface Booking {
  id: string;
  userId: string;
  flightId: string;
  bookingNumber: string;
  passengerName: string;
  seatNumber: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly API_URL = `${environment.apiUrl}/bookings`;
  private readonly CACHE_KEY = 'user_bookings';

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) { }

  getMyBookings(): Observable<Booking[]> {
    const cached = this.cacheService.get<Booking[]>(this.CACHE_KEY);
    
    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    return this.http.get<Booking[]>(`${this.API_URL}/my`).pipe(
      tap(bookings => this.cacheService.set(this.CACHE_KEY, bookings))
    );
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/${id}`);
  }

  createBooking(flightId: string, passengerData: any): Observable<Booking> {
    return this.http.post<Booking>(this.API_URL, { flightId, ...passengerData }).pipe(
      tap(() => this.cacheService.remove(this.CACHE_KEY))
    );
  }

  cancelBooking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.cacheService.remove(this.CACHE_KEY))
    );
  }
}
