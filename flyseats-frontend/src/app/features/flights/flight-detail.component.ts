import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FlightService } from '../../core/services/flight.service';
import { SeatService } from '../../core/services/seat.service';
import { Flight, Seat } from '../../core/models';

@Component({
  selector: 'app-flight-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
    TranslateModule
  ],
  template: `
    <div class="flight-detail-page">
      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="60"></mat-spinner>
        <p>Cargando detalles del vuelo...</p>
      </div>

      <!-- Flight Details -->
      <div *ngIf="!loading && flight" class="detail-content animate-fade-in">
        <!-- Back Button -->
        <button mat-button class="back-button" (click)="onBack()">
          <mat-icon>arrow_back</mat-icon>
          Volver a búsqueda
        </button>

        <!-- Hero Section -->
        <div class="hero-card">
          <div class="hero-header">
            <div class="flight-info-main">
              <div class="airline-badge">
                <mat-icon>flight</mat-icon>
              </div>
              <div>
                <h1>{{ flight.airline }}</h1>
                <p class="flight-number">{{ flight.flight_number }}</p>
              </div>
            </div>
            <mat-chip [class]="'status-chip status-' + flight.status.toLowerCase()">
              {{ flight.status }}
            </mat-chip>
          </div>

          <!-- Route Visualization -->
          <div class="route-section">
            <div class="route-point">
              <div class="airport-code">{{ flight.departure.airport_code }}</div>
              <div class="airport-details">
                <mat-icon>location_on</mat-icon>
                <div>
                  <div class="city">{{ flight.departure.city }}</div>
                  <div class="country">{{ flight.departure.country }}</div>
                </div>
              </div>
              <div class="datetime">
                <mat-icon>schedule</mat-icon>
                <div>
                  <div class="date">{{ formatDate(flight.departure.date) }}</div>
                  <div class="time">{{ flight.departure.time }}</div>
                </div>
              </div>
            </div>

            <div class="route-connector">
              <div class="plane-animation">
                <mat-icon>flight</mat-icon>
              </div>
              <div class="connector-line"></div>
            </div>

            <div class="route-point">
              <div class="airport-code">{{ flight.arrival.airport_code }}</div>
              <div class="airport-details">
                <mat-icon>location_on</mat-icon>
                <div>
                  <div class="city">{{ flight.arrival.city }}</div>
                  <div class="country">{{ flight.arrival.country }}</div>
                </div>
              </div>
              <div class="datetime">
                <mat-icon>schedule</mat-icon>
                <div>
                  <div class="date">{{ formatDate(flight.arrival.date) }}</div>
                  <div class="time">{{ flight.arrival.time }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <mat-icon>people</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ flight.participants_count || 0 }}</div>
                <div class="stat-label">Pasajeros</div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                <mat-icon>swap_horiz</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ flight.active_swaps_count || 0 }}</div>
                <div class="stat-label">Intercambios Activos</div>
              </div>
            </div>

            <div class="stat-card" *ngIf="flight.aircraft">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <mat-icon>airline_seat_recline_normal</mat-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ flight.aircraft.total_seats }}</div>
                <div class="stat-label">Asientos Totales</div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <button mat-raised-button color="primary" class="join-button" (click)="onJoinFlight()">
            <mat-icon>add_circle</mat-icon>
            Unirme a este Vuelo
          </button>
        </div>

        <!-- Passengers Section -->
        <div class="passengers-section" *ngIf="seats.length > 0">
          <h2>
            <mat-icon>people</mat-icon>
            Pasajeros ({{ seats.length }})
          </h2>
          
          <div class="passengers-grid">
            <div *ngFor="let seat of seats" class="passenger-card">
              <div class="seat-badge" [class.open-swap]="seat.open_to_swap">
                {{ seat.seat_number }}
              </div>
              <div class="seat-details">
                <div class="seat-type">
                  <mat-icon>{{ getSeatIcon(seat.seat_details.type) }}</mat-icon>
                  {{ seat.seat_details.type }}
                </div>
                <div class="seat-section">
                  <mat-icon>view_column</mat-icon>
                  {{ seat.seat_details.section }}
                </div>
              </div>
              <div class="swap-status">
                <mat-icon [class.active]="seat.open_to_swap">
                  {{ seat.open_to_swap ? 'check_circle' : 'cancel' }}
                </mat-icon>
                <span>{{ seat.open_to_swap ? 'Abierto a intercambio' : 'No intercambia' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Aircraft Info -->
        <mat-card class="aircraft-card" *ngIf="flight.aircraft">
          <mat-card-header>
            <mat-icon mat-card-avatar>flight_class</mat-icon>
            <mat-card-title>Información de la Aeronave</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="aircraft-info">
              <div class="info-item">
                <span class="label">Modelo:</span>
                <span class="value">{{ flight.aircraft.model }}</span>
              </div>
              <div class="info-item">
                <span class="label">Capacidad:</span>
                <span class="value">{{ flight.aircraft.total_seats }} asientos</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Not Found -->
      <div *ngIf="!loading && !flight" class="not-found">
        <div class="not-found-icon">
          <mat-icon>error_outline</mat-icon>
        </div>
        <h2>Vuelo No Encontrado</h2>
        <p>El vuelo que buscas no existe o ha sido eliminado</p>
        <button mat-raised-button color="primary" (click)="onBack()">
          <mat-icon>arrow_back</mat-icon>
          Volver a Búsqueda
        </button>
      </div>
    </div>
  `,
  styles: [`
    .flight-detail-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    /* Loading */
    .loading-container {
      text-align: center;
      padding: 100px 20px;
      color: white;
    }

    .loading-container p {
      margin-top: 20px;
      font-size: 18px;
      font-weight: 500;
    }

    /* Content */
    .detail-content {
      max-width: 1000px;
      margin: 0 auto;
    }

    .back-button {
      color: white !important;
      margin-bottom: 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
    }

    .back-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Hero Card */
    .hero-card {
      background: white;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      margin-bottom: 24px;
    }

    .hero-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .flight-info-main {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .airline-badge {
      width: 70px;
      height: 70px;
      border-radius: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .airline-badge mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: white;
    }

    .flight-info-main h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: #2d3748;
    }

    .flight-number {
      font-size: 16px;
      color: #718096;
      font-weight: 600;
      margin: 4px 0 0 0;
    }

    /* Route Section */
    .route-section {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 40px;
      background: linear-gradient(135deg, #f8f9fe 0%, #f1f3ff 100%);
      border-radius: 20px;
      margin-bottom: 32px;
      gap: 20px;
    }

    .route-point {
      flex: 1;
      text-align: center;
    }

    .airport-code {
      font-size: 48px;
      font-weight: 800;
      color: #2d3748;
      margin-bottom: 16px;
      letter-spacing: -2px;
    }

    .airport-details {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .airport-details mat-icon {
      color: #667eea;
      font-size: 20px;
    }

    .city {
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
    }

    .country {
      font-size: 14px;
      color: #718096;
    }

    .datetime {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      background: white;
      border-radius: 12px;
      display: inline-flex;
    }

    .datetime mat-icon {
      color: #fa709a;
      font-size: 20px;
    }

    .date {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
    }

    .time {
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
    }

    /* Route Connector */
    .route-connector {
      flex: 0 0 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .plane-animation {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .plane-animation mat-icon {
      font-size: 28px;
      color: white;
      transform: rotate(90deg);
    }

    .connector-line {
      width: 4px;
      height: 80px;
      background: linear-gradient(180deg, #667eea, #764ba2);
      border-radius: 4px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f8f9fe;
      border-radius: 16px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon mat-icon {
      font-size: 28px;
      color: white;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #2d3748;
    }

    .stat-label {
      font-size: 13px;
      color: #718096;
      font-weight: 500;
    }

    /* Join Button */
    .join-button {
      width: 100%;
      height: 56px;
      font-size: 18px !important;
      font-weight: 600 !important;
      border-radius: 14px !important;
    }

    /* Passengers Section */
    .passengers-section {
      background: white;
      border-radius: 24px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .passengers-section h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 24px 0;
    }

    .passengers-section h2 mat-icon {
      color: #667eea;
    }

    .passengers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .passenger-card {
      padding: 20px;
      background: #f8f9fe;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.3s ease;
    }

    .passenger-card:hover {
      background: #f1f3ff;
      transform: translateX(4px);
    }

    .seat-badge {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: linear-gradient(135deg, #718096, #4a5568);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 16px;
      flex-shrink: 0;
    }

    .seat-badge.open-swap {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
    }

    .seat-details {
      flex: 1;
    }

    .seat-type, .seat-section {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #718096;
      margin-bottom: 4px;
    }

    .seat-type mat-icon, .seat-section mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .swap-status {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .swap-status mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #cbd5e0;
    }

    .swap-status mat-icon.active {
      color: #4facfe;
    }

    .swap-status span {
      font-size: 11px;
      color: #718096;
      text-align: center;
      font-weight: 500;
    }

    /* Aircraft Card */
    .aircraft-card {
      border-radius: 24px !important;
    }

    .aircraft-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item .label {
      font-size: 13px;
      color: #718096;
      font-weight: 500;
    }

    .info-item .value {
      font-size: 18px;
      color: #2d3748;
      font-weight: 600;
    }

    /* Status Chip */
    .status-chip {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
      padding: 8px 16px;
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

    /* Not Found */
    .not-found {
      text-align: center;
      padding: 100px 20px;
      color: white;
    }

    .not-found-icon {
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

    .not-found-icon mat-icon {
      font-size: 60px;
      width: 60px;
      height: 60px;
    }

    .not-found h2 {
      font-size: 32px;
      margin: 0 0 12px 0;
    }

    .not-found p {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 32px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-card {
        padding: 24px;
      }

      .route-section {
        flex-direction: column;
        padding: 24px;
      }

      .route-connector {
        flex: 0 0 auto;
      }

      .plane-animation {
        transform: rotate(90deg);
      }

      .connector-line {
        width: 80px;
        height: 4px;
      }

      .passengers-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FlightDetailComponent implements OnInit {
  flight: Flight | null = null;
  seats: Seat[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private flightService: FlightService,
    private seatService: SeatService
  ) {}

  ngOnInit(): void {
    const flightId = this.route.snapshot.paramMap.get('id');
    if (flightId) {
      this.loadFlight(flightId);
      this.loadSeats(flightId);
    }
  }

  loadFlight(flightId: string): void {
    this.flightService.getFlightById(flightId).subscribe({
      next: (flight) => {
        this.flight = flight;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading flight:', error);
        this.loading = false;
      }
    });
  }

  loadSeats(flightId: string): void {
    this.seatService.getFlightSeats(flightId).subscribe({
      next: (seats) => {
        this.seats = seats;
      },
      error: (error) => {
        console.error('Error loading seats:', error);
      }
    });
  }

  onJoinFlight(): void {
    if (this.flight) {
      this.router.navigate(['/flights', this.flight.id, 'join']);
    }
  }

  onBack(): void {
    this.router.navigate(['/flights']);
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

  getSeatIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'window':
        return 'window';
      case 'aisle':
        return 'view_column';
      case 'middle':
        return 'splitscreen';
      default:
        return 'airline_seat_recline_normal';
    }
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }
}
