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
import { FlightService } from '../../core/services/flight.service';
import { CreateFlightRequest, Airport } from '../../core/models';

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
  template: `
    <div class="flight-create-container">
      <mat-card>
        <mat-card-header>
          <mat-icon>flight_takeoff</mat-icon>
          <mat-card-title>Create New Flight</mat-card-title>
          <mat-card-subtitle>Add a new flight to the system</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="flightForm" (ngSubmit)="onSubmit()">
            
            <!-- Basic Flight Info -->
            <h3>Flight Information</h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Flight Number</mat-label>
                <input matInput formControlName="flight_number" placeholder="AA123" required>
                <mat-hint>e.g., AA123, IB2345</mat-hint>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Airline</mat-label>
                <input matInput formControlName="airline" placeholder="American Airlines" required>
              </mat-form-field>
            </div>

            <!-- Departure Information -->
            <h3>Departure</h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Airport Code</mat-label>
                <input matInput formControlName="departure_code" placeholder="MAD" required>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Airport Name</mat-label>
                <input matInput formControlName="departure_name" placeholder="Madrid-Barajas" required>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>City</mat-label>
                <input matInput formControlName="departure_city" placeholder="Madrid" required>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Country</mat-label>
                <input matInput formControlName="departure_country" placeholder="Spain" required>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Date</mat-label>
                <input matInput [matDatepicker]="depDatePicker" formControlName="departure_date" required>
                <mat-datepicker-toggle matSuffix [for]="depDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #depDatePicker></mat-datepicker>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Time</mat-label>
                <input matInput type="time" formControlName="departure_time" required>
              </mat-form-field>
            </div>

            <!-- Arrival Information -->
            <h3>Arrival</h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Airport Code</mat-label>
                <input matInput formControlName="arrival_code" placeholder="JFK" required>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Airport Name</mat-label>
                <input matInput formControlName="arrival_name" placeholder="JFK International" required>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>City</mat-label>
                <input matInput formControlName="arrival_city" placeholder="New York" required>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Country</mat-label>
                <input matInput formControlName="arrival_country" placeholder="USA" required>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Date</mat-label>
                <input matInput [matDatepicker]="arrDatePicker" formControlName="arrival_date" required>
                <mat-datepicker-toggle matSuffix [for]="arrDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #arrDatePicker></mat-datepicker>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Time</mat-label>
                <input matInput type="time" formControlName="arrival_time" required>
              </mat-form-field>
            </div>

            <!-- Aircraft (Optional) -->
            <h3>Aircraft (Optional)</h3>
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Aircraft Model</mat-label>
                <input matInput formControlName="aircraft_model" placeholder="Boeing 777-300ER">
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Total Seats</mat-label>
                <input matInput type="number" formControlName="aircraft_seats" placeholder="350">
              </mat-form-field>
            </div>

            <!-- Actions -->
            <div class="actions">
              <button mat-raised-button type="button" (click)="onCancel()">
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="!flightForm.valid || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Create Flight</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .flight-create-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    mat-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    
    h3 {
      margin-top: 24px;
      margin-bottom: 16px;
      color: #1976d2;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
    
    .half-width {
      flex: 1;
    }
    
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    
    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
    }
  `]
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
