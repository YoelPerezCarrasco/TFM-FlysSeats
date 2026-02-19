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
import { FlightService } from '../../../core/services/flight.service';
import { SeatService } from '../../../core/services/seat.service';
import { Flight, Seat } from '../../../core/models';

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
  templateUrl: './flight-detail.component.html',
  styleUrls: ['./flight-detail.component.scss']
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
