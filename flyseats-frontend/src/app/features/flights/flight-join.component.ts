import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { FlightService } from '../../core/services/flight.service';
import { SeatService } from '../../core/services/seat.service';
import { Flight, JoinFlightRequest, SeatType, SeatSection } from '../../core/models';

@Component({
  selector: 'app-flight-join',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSliderModule,
    MatCheckboxModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslateModule
  ],
  template: `
    <div class="flight-join-container">
      <mat-card *ngIf="flight">
        <mat-card-header>
          <mat-icon mat-card-avatar>airline_seat_recline_normal</mat-icon>
          <mat-card-title>Join Flight {{ flight.flight_number }}</mat-card-title>
          <mat-card-subtitle>
            {{ flight.departure.city }} → {{ flight.arrival.city }}
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="joinForm" (ngSubmit)="onSubmit()">
            
            <!-- Seat Selection -->
            <h3>Your Current Seat</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Seat Number</mat-label>
              <input matInput formControlName="seat_number" placeholder="12A" required>
              <mat-hint>Format: Row + Letter (e.g., 12A, 3F)</mat-hint>
              <mat-error *ngIf="joinForm.get('seat_number')?.hasError('pattern')">
                Invalid seat format. Use format like 12A or 3F
              </mat-error>
            </mat-form-field>

            <!-- Seat Features -->
            <h3>Seat Features</h3>
            <div class="checkbox-group">
              <mat-checkbox formControlName="is_emergency_exit">Emergency Exit</mat-checkbox>
              <mat-checkbox formControlName="extra_legroom">Extra Legroom</mat-checkbox>
              <mat-checkbox formControlName="is_reclinable" [checked]="true">Reclinable</mat-checkbox>
            </div>

            <!-- Swap Preferences -->
            <h3>Swap Preferences</h3>
            <mat-checkbox formControlName="open_to_swap" [checked]="true" class="full-width">
              I'm open to swapping seats
            </mat-checkbox>

            <div *ngIf="joinForm.get('open_to_swap')?.value" class="preferences-section">
              
              <!-- Desired Seat Types -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Preferred Seat Types</mat-label>
                <mat-select formControlName="desired_types" multiple>
                  <mat-option value="WINDOW">Window</mat-option>
                  <mat-option value="AISLE">Aisle</mat-option>
                  <mat-option value="MIDDLE">Middle</mat-option>
                </mat-select>
                <mat-hint>Select all types you'd accept</mat-hint>
              </mat-form-field>

              <!-- Desired Section -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Preferred Section</mat-label>
                <mat-select formControlName="desired_section">
                  <mat-option [value]="null">Any Section</mat-option>
                  <mat-option value="FRONT">Front</mat-option>
                  <mat-option value="MIDDLE">Middle</mat-option>
                  <mat-option value="BACK">Back</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Together Seats -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Seats Together</mat-label>
                <input matInput type="number" formControlName="together_seats" min="0" max="10">
                <mat-hint>How many seats you need together (0 = traveling solo)</mat-hint>
              </mat-form-field>

              <!-- Emergency Exit Preference -->
              <mat-checkbox formControlName="prefer_emergency_exit" class="full-width">
                Prefer emergency exit seats
              </mat-checkbox>

              <!-- Importance Weights -->
              <h4>How important is each preference? (1-5)</h4>
              
              <div class="slider-group">
                <label>Seat Type</label>
                <mat-slider min="1" max="5" step="1" showTickMarks discrete>
                  <input matSliderThumb formControlName="importance_seat_type">
                </mat-slider>
                <span class="slider-value">{{ joinForm.get('importance_seat_type')?.value }}</span>
              </div>

              <div class="slider-group">
                <label>Section</label>
                <mat-slider min="1" max="5" step="1" showTickMarks discrete>
                  <input matSliderThumb formControlName="importance_section">
                </mat-slider>
                <span class="slider-value">{{ joinForm.get('importance_section')?.value }}</span>
              </div>

              <div class="slider-group">
                <label>Together Seats</label>
                <mat-slider min="1" max="5" step="1" showTickMarks discrete>
                  <input matSliderThumb formControlName="importance_together">
                </mat-slider>
                <span class="slider-value">{{ joinForm.get('importance_together')?.value }}</span>
              </div>

              <div class="slider-group">
                <label>Emergency Exit</label>
                <mat-slider min="1" max="5" step="1" showTickMarks discrete>
                  <input matSliderThumb formControlName="importance_emergency">
                </mat-slider>
                <span class="slider-value">{{ joinForm.get('importance_emergency')?.value }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="actions">
              <button mat-button type="button" (click)="onCancel()">
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" [disabled]="!joinForm.valid || loading">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <span *ngIf="!loading">Join Flight</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .flight-join-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    mat-card-avatar {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
    
    h3 {
      margin-top: 24px;
      margin-bottom: 16px;
      color: #1976d2;
    }
    
    h4 {
      margin-top: 16px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #666;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .preferences-section {
      margin-top: 20px;
      padding: 20px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }
    
    .slider-group {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .slider-group label {
      min-width: 140px;
      font-weight: 500;
    }
    
    .slider-group mat-slider {
      flex: 1;
    }
    
    .slider-value {
      min-width: 30px;
      text-align: center;
      font-weight: bold;
      color: #1976d2;
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
      .slider-group {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .slider-group mat-slider {
        width: 100%;
      }
    }
  `]
})
export class FlightJoinComponent implements OnInit {
  flight: Flight | null = null;
  joinForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private flightService: FlightService,
    private seatService: SeatService,
    private snackBar: MatSnackBar
  ) {
    this.joinForm = this.fb.group({
      seat_number: ['', [Validators.required, Validators.pattern(/^\d{1,2}[A-K]$/i)]],
      is_emergency_exit: [false],
      extra_legroom: [false],
      is_reclinable: [true],
      open_to_swap: [true],
      desired_types: [['WINDOW', 'AISLE']],
      desired_section: [null],
      together_seats: [0, [Validators.min(0), Validators.max(10)]],
      prefer_emergency_exit: [false],
      importance_seat_type: [3],
      importance_section: [3],
      importance_together: [3],
      importance_emergency: [3]
    });
  }

  ngOnInit(): void {
    const flightId = this.route.snapshot.paramMap.get('id');
    if (flightId) {
      this.loadFlight(flightId);
    }
  }

  loadFlight(flightId: string): void {
    this.flightService.getFlightById(flightId).subscribe({
      next: (flight) => {
        this.flight = flight;
      },
      error: (error) => {
        console.error('Error loading flight:', error);
        this.snackBar.open('Flight not found', 'Close', { duration: 3000 });
        this.router.navigate(['/flights']);
      }
    });
  }

  onSubmit(): void {
    if (this.joinForm.valid && this.flight) {
      this.loading = true;

      const formValue = this.joinForm.value;
      
      const joinRequest: JoinFlightRequest = {
        user_id: 'user_demo', // TODO: Get from auth service
        seat_number: formValue.seat_number.toUpperCase(),
        is_emergency_exit: formValue.is_emergency_exit,
        extra_legroom: formValue.extra_legroom,
        is_reclinable: formValue.is_reclinable,
        open_to_swap: formValue.open_to_swap
      };

      // Add preferences if open to swap
      if (formValue.open_to_swap) {
        joinRequest.preferences = {
          desired_type: formValue.desired_types,
          desired_section: formValue.desired_section,
          together_seats: formValue.together_seats,
          emergency_exit: formValue.prefer_emergency_exit,
          importance_weights: {
            seat_type: formValue.importance_seat_type,
            section: formValue.importance_section,  
            together_seats: formValue.importance_together,
            emergency_exit: formValue.importance_emergency
          }
        };
      }

      this.seatService.joinFlight(this.flight.id, joinRequest).subscribe({
        next: (seat) => {
          this.loading = false;
          if (seat) {
            this.snackBar.open('Successfully joined flight!', 'OK', { duration: 3000 });
            this.router.navigate(['/flights', this.flight!.id]);
          }
        },
        error: (error) => {
          this.loading = false;
          const message = error.error?.error || 'Failed to join flight';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        }
      });
    }
  }

  onCancel(): void {
    if (this.flight) {
      this.router.navigate(['/flights', this.flight.id]);
    } else {
      this.router.navigate(['/flights']);
    }
  }
}
