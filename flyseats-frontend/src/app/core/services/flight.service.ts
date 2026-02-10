import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from './cache.service';

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
  availableSeats: number;
}

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private readonly API_URL = '/api/flights';
  private readonly CACHE_KEY_PREFIX = 'flights_';

  constructor(
    private http: HttpClient,
    private cacheService: CacheService
  ) { }

  searchFlights(params: FlightSearchParams): Observable<Flight[]> {
    const cacheKey = this.getCacheKey(params);
    const cached = this.cacheService.get<Flight[]>(cacheKey);
    
    if (cached) {
      return new Observable(observer => {
        observer.next(cached);
        observer.complete();
      });
    }

    let httpParams = new HttpParams()
      .set('origin', params.origin)
      .set('destination', params.destination)
      .set('departureDate', params.departureDate)
      .set('passengers', params.passengers.toString());

    if (params.returnDate) {
      httpParams = httpParams.set('returnDate', params.returnDate);
    }

    return this.http.get<Flight[]>(`${this.API_URL}/search`, { params: httpParams }).pipe(
      tap(flights => this.cacheService.set(cacheKey, flights))
    );
  }

  getFlightById(id: string): Observable<Flight> {
    return this.http.get<Flight>(`${this.API_URL}/${id}`);
  }

  private getCacheKey(params: FlightSearchParams): string {
    return `${this.CACHE_KEY_PREFIX}${JSON.stringify(params)}`;
  }
}
