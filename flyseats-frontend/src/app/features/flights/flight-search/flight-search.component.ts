import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
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
import { FlightService } from '../../../core/services/flight.service';
import { Flight, FlightSearchParams } from '../../../core/models';

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
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: '0', opacity: 0, overflow: 'hidden' }))
      ])
    ])
  ]
})
export class FlightSearchComponent implements OnInit {
  searchForm: FormGroup;
  flights: Flight[] = [];
  loading = false;
  searchPerformed = false;
  selectedFlight: Flight | null = null;

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      flight_number: ['']
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
        this.searchPerformed = true;
      },
      error: (error) => {
        console.error('Error loading flights:', error);
        this.loading = false;
      }
    });
  }

  onFlightNumberInput(): void {
    const flightNumber = this.searchForm.get('flight_number')?.value;
    if (flightNumber && flightNumber.length >= 2) {
      // Auto-search as user types
      this.onSearch();
    } else if (!flightNumber) {
      this.loadAllFlights();
    }
  }

  clearSearch(): void {
    this.searchForm.patchValue({ flight_number: '' });
    this.loadAllFlights();
  }

  quickSearch(departure: string, arrival: string): void {
    this.loading = true;
    this.searchPerformed = true;
    
    const params: FlightSearchParams = {
      departure_code: departure,
      arrival_code: arrival
    };
    
    this.flightService.searchFlights(params).subscribe({
      next: (flights) => {
        this.flights = flights;
        this.loading = false;
      },
      error: (error) => {
        console.error('Quick search failed:', error);
        this.loading = false;
      }
    });
  }

  showAllFlights(): void {
    this.searchForm.patchValue({ flight_number: '' });
    this.loadAllFlights();
  }

  onSearch(): void {
    this.loading = true;
    this.searchPerformed = true;
    
    const flightNumber = this.searchForm.get('flight_number')?.value;
    
    if (!flightNumber || flightNumber.trim() === '') {
      this.loadAllFlights();
      return;
    }
    
    const params: FlightSearchParams = {
      flight_number: flightNumber.toUpperCase().trim()
    };
    
    this.flightService.searchFlights(params).subscribe({
      next: (flights) => {
        this.flights = flights;
        this.loading = false;
        this.selectedFlight = null; // Reset selected flight
      },
      error: (error) => {
        console.error('Search failed:', error);
        this.loading = false;
      }
    });
  }

  toggleFlightDetails(flight: Flight): void {
    // Si el mismo vuelo está seleccionado, lo deseleccionamos (collapse)
    if (this.selectedFlight === flight) {
      this.selectedFlight = null;
    } else {
      // Si es otro vuelo, lo seleccionamos (expand)
      this.selectedFlight = flight;
    }
  }

  backToHome(): void {
    this.flights = [];
    this.selectedFlight = null;
    this.searchPerformed = false;
    this.searchForm.patchValue({ flight_number: '' });
  }

  onFlightClick(flight: Flight): void {
    // Pasar el vuelo completo en el state para evitar llamada al backend
    // Esto funciona tanto para vuelos de Amadeus como de la BD
    this.router.navigate(['/flights', flight.id || 'amadeus'], {
      state: { flight }
    });
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

  // Helper methods for Amadeus data structure
  getAirlineName(code: string | undefined): string {
    if (!code) return '';
    const airlines: { [key: string]: string } = {
      'IB': 'Iberia',
      'UX': 'Air Europa',
      'VY': 'Vueling',
      'AA': 'American Airlines',
      'BA': 'British Airways',
      'AF': 'Air France',
      'LH': 'Lufthansa'
    };
    return airlines[code] || code;
  }

  formatDuration(duration: string | undefined): string {
    if (!duration) return '';
    // Format: PT1H25M -> 1h 25m
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;
    
    const hours = match[1] ? match[1].replace('H', 'h ') : '';
    const minutes = match[2] ? match[2].replace('M', 'm') : '';
    return (hours + minutes).trim();
  }

  getLastSegment(flight: any): any {
    const segments = flight?.itineraries?.[0]?.segments;
    return segments ? segments[segments.length - 1] : null;
  }

  // Helper para parsear strings a números en el template
  parseFloat(value: string | undefined): number {
    return parseFloat(value || '0');
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
