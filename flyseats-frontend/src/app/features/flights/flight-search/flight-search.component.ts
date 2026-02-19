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
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.scss']
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
