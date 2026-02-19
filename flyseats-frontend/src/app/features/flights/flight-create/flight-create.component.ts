import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { FlightService } from '../../../core/services/flight.service';
import { CreateFlightRequest, Airport } from '../../../core/models';

@Component({
  selector: 'app-flight-create',
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
    MatSnackBarModule,
    TranslateModule
  ],
  templateUrl: './flight-create.component.html',
  styleUrls: ['./flight-create.component.scss']
})
export class FlightCreateComponent implements OnInit {
  flightForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.flightForm = this.fb.group({
      flight_number: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{2,6}$/i)]],
      airline: ['', Validators.required],
      departure_code: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/i)]],
      departure_name: ['', Validators.required],
      departure_city: ['', Validators.required],
      departure_country: ['', Validators.required],
      departure_date: ['', Validators.required],
      departure_time: ['', Validators.required],
      arrival_code: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/i)]],
      arrival_name: ['', Validators.required],
      arrival_city: ['', Validators.required],
      arrival_country: ['', Validators.required],
      arrival_date: ['', Validators.required],
      arrival_time: ['', Validators.required],
      aircraft_model: [''],
      aircraft_seats: ['', Validators.min(1)]
    });
  }

  ngOnInit(): void {
    // Set default user ID (in real app, get from auth service)
    // We'll use demo user for now
  }

  onSubmit(): void {
    if (this.flightForm.valid) {
      this.loading = true;

      const formValue = this.flightForm.value;
      
      // Format dates
      const departureDate = this.formatDate(formValue.departure_date);
      const arrivalDate = this.formatDate(formValue.arrival_date);

      const departure: Airport = {
        airport_code: formValue.departure_code.toUpperCase(),
        airport_name: formValue.departure_name,
        city: formValue.departure_city,
        country: formValue.departure_country,
        date: departureDate,
        time: formValue.departure_time + ':00',
        timezone: 'UTC'
      };

      const arrival: Airport = {
        airport_code: formValue.arrival_code.toUpperCase(),
        airport_name: formValue.arrival_name,
        city: formValue.arrival_city,
        country: formValue.arrival_country,
        date: arrivalDate,
        time: formValue.arrival_time + ':00',
        timezone: 'UTC'
      };

      const flightData: CreateFlightRequest = {
        flight_number: formValue.flight_number.toUpperCase(),
        airline: formValue.airline,
        departure,
        arrival,
        created_by: 'user_demo'  // TODO: Get from auth service
      };

      // Add aircraft if provided
      if (formValue.aircraft_model && formValue.aircraft_seats) {
        flightData.aircraft = {
          model: formValue.aircraft_model,
          total_seats: parseInt(formValue.aircraft_seats, 10)
        };
      }

      this.flightService.createFlight(flightData).subscribe({
        next: (flight) => {
          this.loading = false;
          if (flight) {
            this.snackBar.open('Flight created successfully!', 'OK', { duration: 3000 });
            this.router.navigate(['/flights', flight.id]);
          }
        },
        error: (error) => {
          this.loading = false;
          const message = error.error?.error || 'Failed to create flight';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/flights']);
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
