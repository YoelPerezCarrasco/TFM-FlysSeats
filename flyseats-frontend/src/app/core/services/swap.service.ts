import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SwapRequest, Seat } from '../models';

export interface SwapSuggestion {
  partner_seat: Seat;
  partner_user: {
    id: string;
    name: string;
    reputation: {
      rating: number;
      total_swaps: number;
      completed_swaps: number;
      percentage_completed: number;
    };
  };
  match_score: number;
  your_seat: string;
  their_seat: string;
  your_seat_details: any;
  their_seat_details: any;
}

export interface MatchingResponse {
  suggestions: SwapSuggestion[];
  total: number;
  your_seat: Seat;
}

@Injectable({
  providedIn: 'root'
})
export class SwapService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get swap suggestions for a user on a flight
   */
  getSwapSuggestions(flightId: string, userId: string, limit: number = 10): Observable<MatchingResponse> {
    const params = new HttpParams()
      .set('user_id', userId)
      .set('limit', limit.toString());

    return this.http.get<MatchingResponse>(
      `${this.API_URL}/flights/${flightId}/matching`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Error getting swap suggestions:', error);
        return of({ suggestions: [], total: 0, your_seat: {} as Seat });
      })
    );
  }

  /**
   * Create a swap request
   */
  createSwapRequest(flightId: string, requesterSeatId: string, partnerSeatId: string): Observable<SwapRequest> {
    return this.http.post<{ swap: SwapRequest }>(`${this.API_URL}/swaps`, {
      flight_id: flightId,
      requester_seat_id: requesterSeatId,
      partner_seat_id: partnerSeatId
    }).pipe(
      map(response => response.swap)
    );
  }

  /**
   * Get a swap request by ID
   */
  getSwap(swapId: string): Observable<SwapRequest | null> {
    return this.http.get<SwapRequest>(`${this.API_URL}/swaps/${swapId}`).pipe(
      catchError(error => {
        console.error('Error getting swap:', error);
        return of(null);
      })
    );
  }

  /**
   * Accept a swap request
   */
  acceptSwap(swapId: string, userId: string): Observable<SwapRequest> {
    return this.http.post<{ swap: SwapRequest }>(`${this.API_URL}/swaps/${swapId}/accept`, {
      user_id: userId
    }).pipe(
      map(response => response.swap)
    );
  }

  /**
   * Reject a swap request
   */
  rejectSwap(swapId: string, userId: string): Observable<SwapRequest> {
    return this.http.post<{ swap: SwapRequest }>(`${this.API_URL}/swaps/${swapId}/reject`, {
      user_id: userId
    }).pipe(
      map(response => response.swap)
    );
  }

  /**
   * Get all swap requests for a user
   */
  getUserSwaps(userId: string, status?: string): Observable<SwapRequest[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<{ swaps: SwapRequest[] }>(
      `${this.API_URL}/swaps/user/${userId}`,
      { params }
    ).pipe(
      map(response => response.swaps || []),
      catchError(error => {
        console.error('Error getting user swaps:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all swap requests for a flight
   */
  getFlightSwaps(flightId: string): Observable<SwapRequest[]> {
    return this.http.get<{ swaps: SwapRequest[] }>(
      `${this.API_URL}/flights/${flightId}/swaps`
    ).pipe(
      map(response => response.swaps || []),
      catchError(error => {
        console.error('Error getting flight swaps:', error);
        return of([]);
      })
    );
  }
}
