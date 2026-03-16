import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { environment } from '../../../environments/environment';
import { 
  Flight, 
  FlightSearchParams, 
  CreateFlightRequest 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private readonly API_URL = `${environment.apiUrl}/flights`;
  private readonly CACHE_KEY_PREFIX = 'flights_';
  private readonly CACHE_TTL = 3600000; // 1 hour

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) { }

  /**
   * Search flights with optional filters
   */
  searchFlights(params?: FlightSearchParams): Observable<Flight[]> {
    const cacheKey = this.getCacheKey(params);
    const cached = this.cacheService.get<Flight[]>(cacheKey);
    
    if (cached) {
      return of(cached);
    }

    let httpParams = new HttpParams();
    
    if (params) {
      if (params.flight_number) {
        httpParams = httpParams.set('flight_number', params.flight_number);
      }
      if (params.departure_code) {
        httpParams = httpParams.set('departure_code', params.departure_code);
      }
      if (params.arrival_code) {
        httpParams = httpParams.set('arrival_code', params.arrival_code);
      }
      if (params.date) {
        httpParams = httpParams.set('date', params.date);
      }
    }

    return this.http.get<Flight[]>(this.API_URL, { params: httpParams }).pipe(
      tap(flights => this.cacheService.set(cacheKey, flights)),
      catchError(error => {
        console.error('Error searching flights:', error);
        return of([]);
      })
    );
  }

  /**
   * Get flight by ID
   */
  getFlightById(id: string): Observable<Flight | null> {
    if (!id || id === 'amadeus' || /^mock/i.test(id)) {
      return of(null);
    }

    return this.http.get<Flight>(`${this.API_URL}/${id}`).pipe(
      catchError(error => {
        console.error('Error getting flight:', error);
        return of(null);
      })
    );
  }

  /**
   * Create new flight
   */
  createFlight(flightData: CreateFlightRequest): Observable<Flight | null> {
    return this.http.post<Flight>(this.API_URL, flightData).pipe(
      tap(() => {
        // Clear cache when new flight is created
        this.clearCache();
      }),
      catchError(error => {
        console.error('Error creating flight:', error);
        throw error;
      })
    );
  }

  /**
   * Update flight
   */
  updateFlight(flightId: string, updates: Partial<Flight>): Observable<Flight | null> {
    return this.http.put<Flight>(`${this.API_URL}/${flightId}`, updates).pipe(
      tap(() => {
        this.clearCache();
      }),
      catchError(error => {
        console.error('Error updating flight:', error);
        return of(null);
      })
    );
  }

  /**
   * Delete flight
   */
  deleteFlight(flightId: string): Observable<boolean> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/${flightId}`).pipe(
      tap(() => {
        this.clearCache();
      }),
      map(() => true),
      catchError(error => {
        console.error('Error deleting flight:', error);
        return of(false);
      })
    );
  }

  /**
   * Ensure a flight from search exists in local DB so user can join seats and request swaps.
   */
  ensureLocalFlightForBooking(flight: Flight): Observable<Flight> {
    const currentId = flight.id;
    if (currentId && currentId !== 'amadeus' && !/^mock/i.test(currentId)) {
      return of(flight);
    }

    const firstSegment = flight.itineraries?.[0]?.segments?.[0];
    const lastSegment = flight.itineraries?.[0]?.segments?.[flight.itineraries?.[0]?.segments?.length - 1];

    const flightNumber = firstSegment
      ? `${firstSegment.carrierCode}${firstSegment.number}`
      : (flight.flight_number || 'EXT000');
    const departureCode = firstSegment?.departure?.iataCode || flight.departure?.airport_code || 'UNK';
    const arrivalCode = lastSegment?.arrival?.iataCode || flight.arrival?.airport_code || 'UNK';
    const departureIso = firstSegment?.departure?.at || new Date().toISOString();
    const arrivalIso = lastSegment?.arrival?.at || departureIso;

    const dateKey = departureIso.split('T')[0].replace(/-/g, '');
    const localFlightId = `ext_${flightNumber}_${departureCode}${arrivalCode}_${dateKey}`.toLowerCase();

    const createPayload = {
      id: localFlightId,
      flight_number: flightNumber,
      departure_code: departureCode,
      arrival_code: arrivalCode,
      departure_time: departureIso,
      arrival_time: arrivalIso
    };

    return this.getFlightById(localFlightId).pipe(
      switchMap(existing => {
        if (existing) {
          return of({ ...flight, id: localFlightId, flight_number: flightNumber } as Flight);
        }

        return this.http.post<{ message: string; flight_id: string }>(this.API_URL, createPayload).pipe(
          map(response => {
            return {
              ...flight,
              id: response.flight_id || localFlightId,
              flight_number: flightNumber
            } as Flight;
          }),
          catchError(() => {
            return this.getFlightById(localFlightId).pipe(
              map(recovered => ({
                ...(recovered || flight),
                id: localFlightId,
                flight_number: flightNumber
              } as Flight))
            );
          })
        );
      })
    );
  }

  /**
   * Clear all flight cache
   */
  clearCache(): void {
    // Clear all keys starting with CACHE_KEY_PREFIX
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  private getCacheKey(params?: FlightSearchParams): string {
    return `${this.CACHE_KEY_PREFIX}${JSON.stringify(params || {})}`;
  }
}
