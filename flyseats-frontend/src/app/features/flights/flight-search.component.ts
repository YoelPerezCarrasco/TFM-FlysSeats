import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { FlightService } from '../../core/services/flight.service';
import { Flight, FlightSearchParams } from '../../core/models';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    TranslateModule
  ],
  template: `
    <div class="flight-search-container">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>flight_takeoff</mat-icon>
          <mat-card-title>Search Flights</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Flight Number</mat-label>
                <input matInput formControlName="flight_number" placeholder="AA123">
                <mat-hint>Optional: Search by flight number</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Departure Date</mat-label>
                <input matInput [matDatepicker]="departurePicker" formControlName="date">
                <mat-datepicker-toggle matSuffix [for]="departurePicker"></mat-datepicker-toggle>
                <mat-datepicker #departurePicker></mat-datepicker>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>From (Airport Code)</mat-label>
                <input matInput formControlName="departure_code" placeholder="MAD" maxlength="3">
                <mat-hint>3-letter code (e.g., MAD, BCN)</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>To (Airport Code)</mat-label>
                <input matInput formControlName="arrival_code" placeholder="BCN" maxlength="3">
                <mat-hint>3-letter code (e.g., MAD, BCN)</mat-hint>
              </mat-form-field>
            </div>
            
            <div class="action-buttons">
              <button mat-raised-button color="primary" type="submit" [disabled]="loading">
                <mat-icon>search</mat-icon>
                Search Flights
              </button>
              <button mat-raised-button color="accent" type="button" (click)="onCreateFlight()">
                <mat-icon>add</mat-icon>
                Create Flight
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      
      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>
      
      <div *ngIf="!loading && flights.length > 0" class="results">
        <h2>{{ flights.length }} Flight(s) Found</h2>
        <mat-card *ngFor="let flight of flights" class="flight-card" (click)="onFlightClick(flight)">
          <mat-card-header>
            <mat-icon mat-card-avatar>flight</mat-icon>
            <mat-card-title>{{ flight.airline }} {{ flight.flight_number }}</mat-card-title>
            <mat-card-subtitle>
              <mat-chip [color]="getStatusColor(flight.status)">{{ flight.status }}</mat-chip>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="flight-route">
              <div class="airport-info">
                <h3>{{ flight.departure.airport_code }}</h3>
                <p>{{ flight.departure.city }}, {{ flight.departure.country }}</p>
                <p class="datetime">{{ flight.departure.date }} {{ flight.departure.time }}</p>
              </div>
              <mat-icon class="route-arrow">arrow_forward</mat-icon>
              <div class="airport-info">
                <h3>{{ flight.arrival.airport_code }}</h3>
                <p>{{ flight.arrival.city }}, {{ flight.arrival.country }}</p>
                <p class="datetime">{{ flight.arrival.date }} {{ flight.arrival.time }}</p>
              </div>
            </div>
            <div class="flight-info">
              <span><mat-icon>people</mat-icon> {{ flight.participants_count || 0 }} participants</span>
              <span><mat-icon>swap_horiz</mat-icon> {{ flight.active_swaps_count || 0 }} active swaps</span>
              <span *ngIf="flight.aircraft"><mat-icon>airline_seat_recline_normal</mat-icon> {{ flight.aircraft.total_seats }} seats</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary">View Details</button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <div *ngIf="!loading && searchPerformed && flights.length === 0" class="no-results">
        <mat-icon>flight_land</mat-icon>
        <p>No flights found matching your criteria</p>
        <button mat-raised-button color="accent" (click)="onCreateFlight()">
          <mat-icon>add</mat-icon>
          Create a New Flight
        </button>
      </div>
    </div>
  `,
  styles: [`
    .flight-search-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    mat-card-avatar {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .half-width {
      flex: 1;
    }
    
    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 16px;
    }
    
    .action-buttons button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
    
    .results {
      margin-top: 30px;
    }
    
    .results h2 {
      margin-bottom: 20px;
      color: #1976d2;
    }
    
    .flight-card {
      margin-bottom: 16px;
      cursor: pointer;
      transition: box-shadow 0.3s;
    }
    
    .flight-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .flight-route {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin: 16px 0;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    
    .airport-info {
      flex: 1;
      text-align: center;
    }
    
    .airport-info h3 {
      font-size: 24px;
      margin: 0 0 8px 0;
      color: #1976d2;
    }
    
    .airport-info p {
      margin: 4px 0;
      font-size: 14px;
      color: #666;
    }
    
    .datetime {
      font-weight: 500;
      color: #333 !important;
    }
    
    .route-arrow {
      font-size: 32px;
      color: #1976d2;
    }
    
    .flight-info {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-wrap: wrap;
    }
    
    .flight-info span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .flight-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .no-results {
      text-align: center;
      padding: 40px 20px;
      margin-top: 30px;
    }
    
    .no-results mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #ccc;
    }
    
    .no-results p {
      font-size: 18px;
      color: #666;
      margin: 20px 0;
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .action-buttons button {
        width: 100%;
      }
      
      .flight-route {
        flex-direction: column;
        gap: 16px;
      }
      
      .route-arrow {
        transform: rotate(90deg);
      }
      
      .flight-info {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class FlightSearchComponent implements OnInit {
  searchForm: FormGroup;
  flights: Flight[] = [];
  loading = false;
  searchPerformed = false;

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      flight_number: [''],
      departure_code: [''],
      arrival_code: [''],
      date: ['']
    });
  }

  ngOnInit(): void {
    // Load all flights initially
    this.loadAllFlights();
  }

  loadAllFlights(): void {
    this.loading = true;
    this.flightService.searchFlights().subscribe({
      next: (flights) => {
        this.flights = flights;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading flights:', error);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.loading = true;
    this.searchPerformed = true;
    
    const formValue = this.searchForm.value;
    const params: FlightSearchParams = {};
    
    if (formValue.flight_number) {
      params.flight_number = formValue.flight_number.toUpperCase();
    }
    if (formValue.departure_code) {
      params.departure_code = formValue.departure_code.toUpperCase();
    }
    if (formValue.arrival_code) {
      params.arrival_code = formValue.arrival_code.toUpperCase();
    }
    if (formValue.date) {
      params.date = this.formatDate(formValue.date);
    }
    
    this.flightService.searchFlights(params).subscribe({
      next: (flights) => {
        this.flights = flights;
        this.loading = false;
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.loading = false;
      }
    });
  }

  onFlightClick(flight: Flight): void {
    this.router.navigate(['/flights', flight.id]);
  }

  onCreateFlight(): void {
    this.router.navigate(['/flights/create']);
  }

  getStatusColor(status: string): 'primary' | 'accent' | 'warn' | '' {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return 'primary';
      case 'boarding':
        return 'accent';
      case 'departed':
        return 'warn';
      default:
        return '';
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
        }
      });
    }
  }
}
