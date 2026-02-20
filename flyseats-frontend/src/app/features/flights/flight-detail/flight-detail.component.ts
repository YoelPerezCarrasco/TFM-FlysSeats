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
    // Primero intentar obtener el vuelo del navigation state (para vuelos de Amadeus)
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state?.flight) {
      // Vuelo pasado desde la búsqueda (Amadeus o BD)
      this.flight = state.flight;
      this.loading = false;
      // Solo cargar asientos si el vuelo tiene ID (vuelos de BD)
      if (this.flight?.id) {
        this.loadSeats(this.flight.id);
      }
    } else {
      // Fallback: cargar desde backend (solo para vuelos de BD)
      const flightId = this.route.snapshot.paramMap.get('id');
      if (flightId && flightId !== 'amadeus') {
        this.loadFlight(flightId);
        this.loadSeats(flightId);
      }
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

  formatDate(date: string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }

  // Helper methods para manejar tanto vuelos de Amadeus como de la BD
  getAirlineName(): string {
    // Para vuelos de Amadeus
    if (this.flight?.validatingAirlineCodes?.[0]) {
      const code = this.flight.validatingAirlineCodes[0];
      const airlines: { [key: string]: string } = {
        'IB': 'Iberia', 'UX': 'Air Europa', 'VY': 'Vueling',
        'AA': 'American Airlines', 'BA': 'British Airways',
        'AF': 'Air France', 'LH': 'Lufthansa', 'DL': 'Delta Airlines',
        'UA': 'United Airlines', 'KL': 'KLM'
      };
      return airlines[code] || code;
    }
    // Para vuelos legacy de BD
    return this.flight?.airline || 'Aerolínea desconocida';
  }

  getFlightNumber(): string {
    // Para vuelos de Amadeus
    const firstSegment = this.flight?.itineraries?.[0]?.segments?.[0];
    if (firstSegment) {
      return `${firstSegment.carrierCode} ${firstSegment.number}`;
    }
    // Para vuelos legacy de BD
    return this.flight?.flight_number || '';
  }

  getDepartureCode(): string {
    // Para vuelos de Amadeus
    const firstSegment = this.flight?.itineraries?.[0]?.segments?.[0];
    if (firstSegment) {
      return firstSegment.departure?.iataCode || '';
    }
    // Para vuelos legacy de BD
    return this.flight?.departure?.airport_code || '';
  }

  getArrivalCode(): string {
    // Para vuelos de Amadeus
    const segments = this.flight?.itineraries?.[0]?.segments;
    if (segments && segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return lastSegment.arrival?.iataCode || '';
    }
    // Para vuelos legacy de BD
    return this.flight?.arrival?.airport_code || '';
  }

  getDepartureTime(): string {
    // Para vuelos de Amadeus
    const firstSegment = this.flight?.itineraries?.[0]?.segments?.[0];
    if (firstSegment?.departure?.at) {
      const date = new Date(firstSegment.departure.at);
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    // Para vuelos legacy de BD
    return this.flight?.departure?.time || '';
  }

  getArrivalTime(): string {
    // Para vuelos de Amadeus
    const segments = this.flight?.itineraries?.[0]?.segments;
    if (segments && segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.arrival?.at) {
        const date = new Date(lastSegment.arrival.at);
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      }
    }
    // Para vuelos legacy de BD
    return this.flight?.arrival?.time || '';
  }

  getDepartureDate(): string {
    // Para vuelos de Amadeus
    const firstSegment = this.flight?.itineraries?.[0]?.segments?.[0];
    if (firstSegment?.departure?.at) {
      return this.formatDate(firstSegment.departure.at);
    }
    // Para vuelos legacy de BD
    return this.formatDate(this.flight?.departure?.date);
  }

  getArrivalDate(): string {
    // Para vuelos de Amadeus
    const segments = this.flight?.itineraries?.[0]?.segments;
    if (segments && segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.arrival?.at) {
        return this.formatDate(lastSegment.arrival.at);
      }
    }
    // Para vuelos legacy de BD
    return this.formatDate(this.flight?.arrival?.date);
  }

  getPrice(): string {
    // Para vuelos de Amadeus
    if (this.flight?.price?.total) {
      return `${this.flight.price.total}€`;
    }
    // Para vuelos legacy de BD (no tienen precio)
    return '';
  }

  getCabin(): string {
    // Para vuelos de Amadeus
    if (this.flight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin) {
      return this.flight.travelerPricings[0].fareDetailsBySegment[0].cabin;
    }
    // Para vuelos legacy de BD
    return 'ECONOMY';
  }

  isAmadeusFlight(): boolean {
    return !!this.flight?.itineraries;
  }
}
