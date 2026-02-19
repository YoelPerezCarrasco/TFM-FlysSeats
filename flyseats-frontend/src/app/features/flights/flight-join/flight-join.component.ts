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
  templateUrl: './flight-join.component.html',
  styleUrls: ['./flight-join.component.scss']
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
