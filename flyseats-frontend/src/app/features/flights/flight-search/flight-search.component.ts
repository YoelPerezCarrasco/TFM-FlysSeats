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
  showHome = true;

  // Mapa flexible de destinos: nombre/variante → código IATA
  private destinationMap: { [key: string]: { departure: string; arrival: string } } = {
    // Barcelona
    'barcelona': { departure: 'MAD', arrival: 'BCN' },
    'bcn': { departure: 'MAD', arrival: 'BCN' },
    'barna': { departure: 'MAD', arrival: 'BCN' },
    'el prat': { departure: 'MAD', arrival: 'BCN' },
    // Madrid
    'madrid': { departure: 'BCN', arrival: 'MAD' },
    'mad': { departure: 'BCN', arrival: 'MAD' },
    'barajas': { departure: 'BCN', arrival: 'MAD' },
    // Londres
    'londres': { departure: 'MAD', arrival: 'LHR' },
    'london': { departure: 'MAD', arrival: 'LHR' },
    'lhr': { departure: 'MAD', arrival: 'LHR' },
    'heathrow': { departure: 'MAD', arrival: 'LHR' },
    // Roma
    'roma': { departure: 'MAD', arrival: 'FCO' },
    'rome': { departure: 'MAD', arrival: 'FCO' },
    'fco': { departure: 'MAD', arrival: 'FCO' },
    'fiumicino': { departure: 'MAD', arrival: 'FCO' },
    // París
    'paris': { departure: 'MAD', arrival: 'CDG' },
    'cdg': { departure: 'MAD', arrival: 'CDG' },
    'charles de gaulle': { departure: 'MAD', arrival: 'CDG' },
    // Nueva York
    'nueva york': { departure: 'MAD', arrival: 'JFK' },
    'new york': { departure: 'MAD', arrival: 'JFK' },
    'ny': { departure: 'MAD', arrival: 'JFK' },
    'jfk': { departure: 'MAD', arrival: 'JFK' },
    'nyc': { departure: 'MAD', arrival: 'JFK' },
    // Lisboa
    'lisboa': { departure: 'MAD', arrival: 'LIS' },
    'lisbon': { departure: 'MAD', arrival: 'LIS' },
    'lis': { departure: 'MAD', arrival: 'LIS' },
    // Ámsterdam
    'amsterdam': { departure: 'MAD', arrival: 'AMS' },
    'ams': { departure: 'MAD', arrival: 'AMS' },
    // Berlín
    'berlin': { departure: 'MAD', arrival: 'BER' },
    'ber': { departure: 'MAD', arrival: 'BER' },
    // Milán
    'milan': { departure: 'MAD', arrival: 'MXP' },
    'mxp': { departure: 'MAD', arrival: 'MXP' },
    // Múnich
    'munich': { departure: 'MAD', arrival: 'MUC' },
    'muc': { departure: 'MAD', arrival: 'MUC' },
    // Dubái
    'dubai': { departure: 'MAD', arrival: 'DXB' },
    'dxb': { departure: 'MAD', arrival: 'DXB' },
    // Atenas
    'atenas': { departure: 'MAD', arrival: 'ATH' },
    'athens': { departure: 'MAD', arrival: 'ATH' },
    'ath': { departure: 'MAD', arrival: 'ATH' },
    // Estambul
    'estambul': { departure: 'MAD', arrival: 'IST' },
    'istanbul': { departure: 'MAD', arrival: 'IST' },
    'ist': { departure: 'MAD', arrival: 'IST' },
    // Viena
    'viena': { departure: 'MAD', arrival: 'VIE' },
    'vienna': { departure: 'MAD', arrival: 'VIE' },
    'vie': { departure: 'MAD', arrival: 'VIE' },
    // Praga
    'praga': { departure: 'MAD', arrival: 'PRG' },
    'prague': { departure: 'MAD', arrival: 'PRG' },
    'prg': { departure: 'MAD', arrival: 'PRG' },
    // Zúrich
    'zurich': { departure: 'MAD', arrival: 'ZRH' },
    'zrh': { departure: 'MAD', arrival: 'ZRH' },
    // Málaga
    'malaga': { departure: 'MAD', arrival: 'AGP' },
    'agp': { departure: 'MAD', arrival: 'AGP' },
    // Sevilla
    'sevilla': { departure: 'MAD', arrival: 'SVQ' },
    'svq': { departure: 'MAD', arrival: 'SVQ' },
    // Palma
    'palma': { departure: 'MAD', arrival: 'PMI' },
    'mallorca': { departure: 'MAD', arrival: 'PMI' },
    'pmi': { departure: 'MAD', arrival: 'PMI' },
    // Ibiza
    'ibiza': { departure: 'MAD', arrival: 'IBZ' },
    'ibz': { departure: 'MAD', arrival: 'IBZ' },
    // Tenerife
    'tenerife': { departure: 'MAD', arrival: 'TFS' },
    'tfs': { departure: 'MAD', arrival: 'TFS' },
    // Gran Canaria
    'gran canaria': { departure: 'MAD', arrival: 'LPA' },
    'las palmas': { departure: 'MAD', arrival: 'LPA' },
    'lpa': { departure: 'MAD', arrival: 'LPA' },
  };

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      destination: ['']
    });
  }

  ngOnInit(): void {
    // No cargamos vuelos al inicio, mostramos el home
  }

  private resolveDestination(input: string): { departure: string; arrival: string } | null {
    const normalized = input.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents

    // Exact match
    if (this.destinationMap[normalized]) {
      return this.destinationMap[normalized];
    }

    // Partial match: find first key that contains or is contained
    for (const key of Object.keys(this.destinationMap)) {
      if (key.includes(normalized) || normalized.includes(key)) {
        return this.destinationMap[key];
      }
    }

    // If input looks like an IATA code (3 letters), try as arrival from MAD
    if (/^[a-z]{3}$/i.test(normalized)) {
      return { departure: 'MAD', arrival: normalized.toUpperCase() };
    }

    // If input contains arrow pattern like "MAD BCN" or "MAD-BCN"
    const routeMatch = normalized.match(/([a-z]{3})[\s\-→>]+([a-z]{3})/i);
    if (routeMatch) {
      return { departure: routeMatch[1].toUpperCase(), arrival: routeMatch[2].toUpperCase() };
    }

    return null;
  }

  onDestinationInput(): void {
    // No auto-search, wait for submit or enter
  }

  clearSearch(): void {
    this.searchForm.patchValue({ destination: '' });
  }

  quickSearch(departure: string, arrival: string): void {
    this.loading = true;
    this.showHome = false;
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

  onSearch(): void {
    const destination = this.searchForm.get('destination')?.value;
    
    if (!destination || destination.trim() === '') {
      return;
    }

    const resolved = this.resolveDestination(destination);
    
    if (!resolved) {
      // Si no se reconoce, intentar como código IATA directo desde MAD
      this.quickSearch('MAD', destination.toUpperCase().trim().substring(0, 3));
      return;
    }

    this.quickSearch(resolved.departure, resolved.arrival);
  }

  showAllFlights(): void {
    this.searchForm.patchValue({ destination: '' });
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
    this.showHome = true;
    this.searchForm.patchValue({ destination: '' });
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
