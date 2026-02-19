import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Seat, 
  JoinFlightRequest 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class SeatService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get all seats for a flight
   */
  getFlightSeats(flightId: string): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.API_URL}/flights/${flightId}/seats`).pipe(
      catchError(error => {
        console.error('Error getting flight seats:', error);
        return of([]);
      })
    );
  }

  /**
   * Join flight with a seat
   */
  joinFlight(flightId: string, seatData: JoinFlightRequest): Observable<Seat | null> {
    return this.http.post<Seat>(`${this.API_URL}/flights/${flightId}/seats`, seatData).pipe(
      catchError(error => {
        console.error('Error joining flight:', error);
        throw error;
      })
    );
  }

  /**
   * Get seat by ID
   */
  getSeatById(seatId: string): Observable<Seat | null> {
    return this.http.get<Seat>(`${this.API_URL}/seats/${seatId}`).pipe(
      catchError(error => {
        console.error('Error getting seat:', error);
        return of(null);
      })
    );
  }

  /**
   * Update seat preferences
   */
  updateSeatPreferences(seatId: string, updates: Partial<Seat>): Observable<Seat | null> {
    return this.http.put<Seat>(`${this.API_URL}/seats/${seatId}`, updates).pipe(
      catchError(error => {
        console.error('Error updating seat:', error);
        return of(null);
      })
    );
  }

  /**
   * Leave flight (delete seat)
   */
  leaveFlight(seatId: string): Observable<boolean> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/seats/${seatId}`).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error leaving flight:', error);
        return of(false);
      })
    );
  }

  /**
   * Check if seat number is valid format (e.g., 12A, 3F)
   */
  isValidSeatNumber(seatNumber: string): boolean {
    const pattern = /^\d{1,2}[A-K]$/i;
    return pattern.test(seatNumber);
  }

  /**
   * Parse seat number into row and column
   */
  parseSeatNumber(seatNumber: string): { row: number; column: string } | null {
    const match = seatNumber.match(/^(\d{1,2})([A-K])$/i);
    if (!match) {
      return null;
    }
    return {
      row: parseInt(match[1], 10),
      column: match[2].toUpperCase()
    };
  }
}
