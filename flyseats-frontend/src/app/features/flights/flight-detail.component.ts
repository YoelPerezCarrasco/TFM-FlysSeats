import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
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
    TranslateModule
  ],
  template: `
    <div class="flight-detail-container">
      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>

      <div *ngIf="!loading && flight">
        <!-- Flight Header -->
        <mat-card class="header-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>flight</mat-icon>
            <mat-card-title>
              {{ flight.airline }} {{ flight.flight_number }}
            </mat-card-title>
            <mat-card-subtitle>
              <mat-chip [color]="getStatusColor(flight.status)">
                {{ flight.status | uppercase }}
              </mat-chip>
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

            <div class="flight-stats">
              <div class="stat">
                <mat-icon>people</mat-icon>
                <span>{{ flight.participants_count }} participants</span>
              </div>
              <div class="stat">
                <mat-icon>swap_horiz</mat-icon>
                <span>{{ flight.active_swaps_count }} active swaps</span>
              </div>
              <div class="stat" *ngIf="flight.aircraft">
                <mat-icon>airline_seat_recline_normal</mat-icon>
                <span>{{ flight.aircraft.total_seats }} total seats</span>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="onJoinFlight()">
              <mat-icon>add</mat-icon>
              Join This Flight
            </button>
            <button mat-button (click)="onBack()">
              <mat-icon>arrow_back</mat-icon>
              Back to Search
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Seats List -->
        <mat-card class="seats-card" *ngIf="seats.length > 0">
          <mat-card-header>
            <mat-card-title>Passengers on This Flight</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <table mat-table [dataSource]="seats" class="seats-table">
              <!-- Seat Number Column -->
              <ng-container matColumnDef="seat_number">
                <th mat-header-cell *matHeaderCellDef>Seat</th>
                <td mat-cell *matCellDef="let seat">{{ seat.seat_number }}</td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let seat">
                  <mat-chip size="small">{{ seat.seat_details.type }}</mat-chip>
                </td>
              </ng-container>

              <!-- Section Column -->
              <ng-container matColumnDef="section">
                <th mat-header-cell *matHeaderCellDef>Section</th>
                <td mat-cell *matCellDef="let seat">{{ seat.seat_details.section }}</td>
              </ng-container>

              <!-- Swap Column -->
              <ng-container matColumnDef="open_to_swap">
                <th mat-header-cell *matHeaderCellDef>Open to Swap</th>
                <td mat-cell *matCellDef="let seat">
                  <mat-icon [color]="seat.open_to_swap ? 'primary' : 'warn'">
                    {{ seat.open_to_swap ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Aircraft Info -->
        <mat-card class="aircraft-card" *ngIf="flight.aircraft">
          <mat-card-header>
            <mat-icon mat-card-avatar>flight_class</mat-icon>
            <mat-card-title>Aircraft Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Model:</strong> {{ flight.aircraft.model }}</p>
            <p><strong>Total Seats:</strong> {{ flight.aircraft.total_seats }}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="!loading && !flight" class="not-found">
        <mat-icon>error_outline</mat-icon>
        <h2>Flight Not Found</h2>
        <button mat-raised-button color="primary" (click)="onBack()">
          Back to Search
        </button>
      </div>
    </div>
  `,
  styles: [`
    .flight-detail-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    
    .header-card {
      margin-bottom: 20px;
    }
    
    mat-card-avatar {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
    
    .flight-route {
      display: flex;
      align-items: center;
      justify-content: space-around;
      margin: 24px 0;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    
    .airport-info {
      text-align: center;
    }
    
    .airport-info h3 {
      font-size: 32px;
      margin: 0;
      color: #1976d2;
    }
    
    .airport-info p {
      margin: 4px 0;
    }
    
    .datetime {
      font-size: 0.9em;
      color: #666;
    }
    
    .route-arrow {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }
    
    .flight-stats {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      flex-wrap: wrap;
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .stat mat-icon {
      color: #666;
    }
    
    mat-card-actions {
      display: flex;
      gap: 12px;
      padding: 16px;
    }
    
    .seats-card, .aircraft-card {
      margin-bottom: 20px;
    }
    
    .seats-table {
      width: 100%;
    }
    
    .not-found {
      text-align: center;
      padding: 60px 20px;
    }
    
    .not-found mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #999;
    }
    
    @media (max-width: 768px) {
      .flight-route {
        flex-direction: column;
        gap: 16px;
      }
      
      .route-arrow {
        transform: rotate(90deg);
      }
      
      .flight-stats {
        flex-direction: column;
      }
      
      mat-card-actions {
        flex-direction: column;
      }
      
      mat-card-actions button {
        width: 100%;
      }
    }
  `]
})
export class FlightDetailComponent implements OnInit {
  flight: Flight | null = null;
  seats: Seat[] = [];
  loading = true;
  displayedColumns: string[] = ['seat_number', 'type', 'section', 'open_to_swap'];

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

  getStatusColor(status: string): string {
    switch (status) {
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
}
