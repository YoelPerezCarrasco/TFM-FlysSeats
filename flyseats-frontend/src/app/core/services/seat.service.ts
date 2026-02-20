import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Seat, 
  SeatPreferences,
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
    return this.http.get<{ seats: Seat[] }>(`${this.API_URL}/flights/${flightId}/seats`).pipe(
      map(response => response.seats || []),
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
    return this.http.post<{ seat: Seat }>(`${this.API_URL}/flights/${flightId}/seats`, seatData).pipe(
      map(response => response.seat),
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
  updatePreferences(seatId: string, preferences: SeatPreferences, openToSwap: boolean = true): Observable<any> {
    return this.http.put(`${this.API_URL}/seats/${seatId}/preferences`, {
      preferences: {
        desired_type: preferences.desired_type,
        desired_section: preferences.desired_section,
        together_seats: preferences.together_seats,
        emergency_exit: preferences.emergency_exit,
        importance_weights: preferences.importance_weights
      },
      open_to_swap: openToSwap
    }).pipe(
      catchError(error => {
        console.error('Error updating preferences:', error);
        throw error;
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
