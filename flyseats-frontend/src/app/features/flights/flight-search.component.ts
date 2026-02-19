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
    <div class="flight-search-page">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title animate-fade-in">
            <span class="gradient-text">FlysSeats</span>
          </h1>
          <p class="hero-subtitle animate-fade-in">Encuentra tu vuelo perfecto y intercambia asientos con otros pasajeros</p>
        </div>
        
        <!-- Search Card -->
        <mat-card class="search-card glass-card animate-slide-in">
          <mat-card-content>
            <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
              <div class="search-header">
                <mat-icon class="search-icon">search</mat-icon>
                <h2>Buscar Vuelos</h2>
              </div>
              
              <div class="form-grid">
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Número de Vuelo</mat-label>
                  <input matInput formControlName="flight_number" placeholder="AA123">
                  <mat-icon matPrefix>confirmation_number</mat-icon>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Fecha</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="date">
                  <mat-datepicker-toggle matPrefix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Desde</mat-label>
                  <input matInput formControlName="departure_code" placeholder="MAD" maxlength="3">
                  <mat-icon matPrefix>flight_takeoff</mat-icon>
                </mat-form-field>
                
                <mat-form-field appearance="outline" class="form-field">
                  <mat-label>Hasta</mat-label>
                  <input matInput formControlName="arrival_code" placeholder="BCN" maxlength="3">
                  <mat-icon matPrefix>flight_land</mat-icon>
                </mat-form-field>
              </div>
              
              <div class="action-buttons">
                <button mat-raised-button color="primary" type="submit" [disabled]="loading" class="search-btn">
                  <mat-icon>search</mat-icon>
                  Buscar Vuelos
                </button>
                <button mat-raised-button color="accent" type="button" (click)="onCreateFlight()" class="create-btn">
                  <mat-icon>add_circle</mat-icon>
                  Crear Vuelo
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
      
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Buscando vuelos...</p>
      </div>
      
      <!-- Results Section -->
      <div *ngIf="!loading && flights.length > 0" class="results-section">
        <div class="results-header">
          <h2><span class="gradient-text">{{ flights.length }}</span> Vuelos Encontrados</h2>
          <div class="results-stats">
            <mat-chip>
              <mat-icon>date_range</mat-icon>
              Hoy
            </mat-chip>
            <mat-chip>
              <mat-icon>trending_up</mat-icon>
              Más populares
            </mat-chip>
          </div>
        </div>
        
        <div class="flights-grid">
          <mat-card *ngFor="let flight of flights; let i = index" 
                    class="flight-card" 
                    (click)="onFlightClick(flight)"
                    [style.animation-delay]="(i * 0.1) + 's'">
            <mat-card-header>
              <div class="flight-header">
                <div class="flight-number">
                  <mat-icon class="airline-icon">flight</mat-icon>
                  <div>
                    <h3>{{ flight.airline }}</h3>
                    <span class="flight-code">{{ flight.flight_number }}</span>
                  </div>
                </div>
                <mat-chip [class]="'status-chip status-' + flight.status.toLowerCase()">
                  {{ flight.status }}
                </mat-chip>
              </div>
            </mat-card-header>
            
            <mat-card-content>
              <div class="flight-route">
                <div class="airport">
                  <div class="airport-code">{{ flight.departure.airport_code }}</div>
                  <div class="airport-name">{{ flight.departure.city }}</div>
                  <div class="flight-time">{{ flight.departure.time }}</div>
                </div>
                
                <div class="route-line">
                  <div class="plane-icon">
                    <mat-icon>flight</mat-icon>
                  </div>
                  <div class="duration-line"></div>
                </div>
                
                <div class="airport">
                  <div class="airport-code">{{ flight.arrival.airport_code }}</div>
                  <div class="airport-name">{{ flight.arrival.city }}</div>
                  <div class="flight-time">{{ flight.arrival.time }}</div>
                </div>
              </div>
              
              <div class="flight-stats">
                <div class="stat">
                  <mat-icon>people</mat-icon>
                  <span>{{ flight.participants_count || 0 }} pasajeros</span>
                </div>
                <div class="stat">
                  <mat-icon>swap_horiz</mat-icon>
                  <span>{{ flight.active_swaps_count || 0 }} intercambios</span>
                </div>
                <div class="stat" *ngIf="flight.aircraft">
                  <mat-icon>airline_seat_recline_normal</mat-icon>
                  <span>{{ flight.aircraft.total_seats }} asientos</span>
                </div>
              </div>
            </mat-card-content>
            
            <mat-card-actions>
              <button mat-button class="view-btn">
                Ver Detalles
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
      
      <!-- No Results -->
      <div *ngIf="!loading && searchPerformed && flights.length === 0" class="no-results">
        <div class="no-results-icon">
          <mat-icon>flight_land</mat-icon>
        </div>
        <h3>No se encontraron vuelos</h3>
        <p>Intenta ajustar tus criterios de búsqueda o crea un nuevo vuelo</p>
        <button mat-raised-button color="accent" (click)="onCreateFlight()">
          <mat-icon>add_circle</mat-icon>
          Crear Nuevo Vuelo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .flight-search-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding-bottom: 60px;
    }
    
    /* Hero Section */
    .hero-section {
      padding: 60px 20px 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .hero-content {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .hero-title {
      font-size: 64px;
      font-weight: 800;
      margin: 0 0 20px 0;
      letter-spacing: -2px;
    }
    
    .hero-title .gradient-text {
      color: white;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    
    .hero-subtitle {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.95);
      margin: 0;
      font-weight: 400;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    /* Search Card */
    .search-card {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
    }
    
    .search-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .search-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #667eea;
    }
    
    .search-header h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #2d3748;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .form-field {
      width: 100%;
    }
    
    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
    
    .search-btn, .create-btn {
      min-width: 180px;
      height: 48px;
      font-size: 16px !important;
    }
    
    /* Loading */
    .loading-container {
      text-align: center;
      padding: 60px 20px;
      color: white;
    }
    
    .loading-container p {
      margin-top: 20px;
      font-size: 18px;
      font-weight: 500;
    }
    
    /* Results Section */
    .results-section {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .results-header h2 {
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      color: white;
    }
    
    .results-stats {
      display: flex;
      gap: 12px;
    }
    
    .results-stats mat-chip {
      background: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      font-weight: 500;
      backdrop-filter: blur(10px);
    }
    
    /* Flights Grid */
    .flights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 24px;
    }
    
    .flight-card {
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      animation: fadeIn 0.6s ease-out backwards;
      border: 2px solid transparent;
      overflow: hidden;
      position: relative;
    }
    
    .flight-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transform: scaleX(0);
      transition: transform 0.3s ease;
    }
    
    .flight-card:hover::before {
      transform: scaleX(1);
    }
    
    .flight-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
      border-color: #667eea;
    }
    
    .flight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .flight-number {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .airline-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #667eea;
    }
    
    .flight-number h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #2d3748;
    }
    
    .flight-code {
      color: #718096;
      font-size: 14px;
      font-weight: 600;
    }
    
    .status-chip {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
    }
    
    .status-upcoming {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
      color: white !important;
    }
    
    .status-boarding {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%) !important;
      color: white !important;
    }
    
    .status-departed {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%) !important;
      color: #2d3748 !important;
    }
    
    /* Flight Route */
    .flight-route {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 0;
      margin: 16px 0;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .airport {
      flex: 1;
      text-align: center;
    }
    
    .airport-code {
      font-size: 32px;
      font-weight: 800;
      color: #2d3748;
      letter-spacing: -1px;
      margin-bottom: 4px;
    }
    
    .airport-name {
      font-size: 14px;
      color: #718096;
      margin-bottom: 4px;
    }
    
    .flight-time {
      font-size: 16px;
      font-weight: 600;
      color: #667eea;
    }
    
    .route-line {
      flex: 0 0 120px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    
    .plane-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      animation: pulse 2s infinite;
    }
    
    .plane-icon mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      transform: rotate(90deg);
    }
    
    .duration-line {
      width: 2px;
      height: 40px;
      background: linear-gradient(180deg, #667eea, #764ba2);
      border-radius: 2px;
    }
    
    /* Flight Stats */
    .flight-stats {
      display: flex;
      justify-content: space-around;
      gap: 16px;
      padding-top: 16px;
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #718096;
      font-size: 13px;
    }
    
    .stat mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #667eea;
    }
    
    /* View Button */
    .view-btn {
      width: 100%;
      color: #667eea !important;
      font-weight: 600 !important;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .view-btn mat-icon {
      transition: transform 0.3s ease;
    }
    
    .flight-card:hover .view-btn mat-icon {
      transform: translateX(4px);
    }
    
    /* No Results */
    .no-results {
      text-align: center;
      padding: 80px 20px;
      color: white;
    }
    
    .no-results-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      margin-bottom: 24px;
      backdrop-filter: blur(10px);
    }
    
    .no-results-icon mat-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
      color: white;
      opacity: 0.8;
    }
    
    .no-results h3 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 12px 0;
    }
    
    .no-results p {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 32px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 48px;
      }
      
      .hero-subtitle {
        font-size: 16px;
      }
      
      .search-card {
        padding: 24px;
      }
      
      .form-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .search-btn, .create-btn {
        width: 100%;
      }
      
      .flights-grid {
        grid-template-columns: 1fr;
      }
      
      .results-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .flight-route {
        flex-direction: column;
        gap: 20px;
      }
      
      .route-line {
        flex: 0 0 auto;
      }
      
      .plane-icon {
        transform: rotate(90deg);
      }
      
      .duration-line {
        width: 40px;
        height: 2px;
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
