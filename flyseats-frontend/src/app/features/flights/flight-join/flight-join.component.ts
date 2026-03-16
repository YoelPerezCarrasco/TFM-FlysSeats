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
import { FlightService } from '../../../core/services/flight.service';
import { SeatService } from '../../../core/services/seat.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { Flight, JoinFlightRequest, Seat } from '../../../core/models';

interface CabinSeat {
  seatNumber: string;
  row: number;
  column: string;
  occupied: boolean;
  isEmergencyExit: boolean;
  extraLegroom: boolean;
  section: 'FRONT' | 'MIDDLE' | 'BACK';
  type: 'WINDOW' | 'AISLE' | 'MIDDLE';
}

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
  bookingFlow = false;
  seatsLoading = false;
  cabinRows: CabinSeat[][] = [];
  readonly cabinColumns = ['A', 'B', 'C', 'D', 'E', 'F'];
  private occupiedSeatNumbers = new Set<string>();
  private readonly totalRows = 30;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private flightService: FlightService,
    private seatService: SeatService,
    private bookingService: BookingService,
    private authService: AuthService,
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
    const state = history.state;
    this.bookingFlow = !!state?.bookingFlow;

    if (state?.flight) {
      const stateFlight = state.flight as Flight;
      this.flight = stateFlight;
      if (stateFlight?.id) {
        this.loadSeatMap(stateFlight.id);
      }
    }

    const flightId = this.route.snapshot.paramMap.get('id');
    if (flightId && !this.isMockAmadeusId(flightId)) {
      if (!this.flight || this.flight.id !== flightId) {
        this.loadFlight(flightId);
      } else {
        this.loadSeatMap(flightId);
      }
    } else {
      this.snackBar.open('Este vuelo es externo y no se puede unir desde aquí', 'Cerrar', { duration: 4000 });
      this.router.navigate(['/flights']);
    }
  }

  private isMockAmadeusId(flightId: string): boolean {
    return /^mock/i.test(flightId) || flightId === 'amadeus';
  }

  loadFlight(flightId: string): void {
    this.flightService.getFlightById(flightId).subscribe({
      next: (flight) => {
        this.flight = flight;
        if (flight?.id) {
          this.loadSeatMap(flight.id);
        }
      },
      error: (error) => {
        console.error('Error loading flight:', error);
        this.snackBar.open('Flight not found', 'Close', { duration: 3000 });
        this.router.navigate(['/flights']);
      }
    });
  }

  private loadSeatMap(flightId: string): void {
    this.seatsLoading = true;
    this.seatService.getFlightSeats(flightId).subscribe({
      next: (seats) => {
        this.occupiedSeatNumbers = new Set((seats || []).map((seat: Seat) => (seat.seat_number || '').toUpperCase()));
        this.buildCabinRows();
        this.seatsLoading = false;
      },
      error: () => {
        this.occupiedSeatNumbers = new Set<string>();
        this.buildCabinRows();
        this.seatsLoading = false;
      }
    });
  }

  private buildCabinRows(): void {
    const rows: CabinSeat[][] = [];
    const selectedSeat = (this.joinForm.get('seat_number')?.value || '').toUpperCase();

    for (let row = 1; row <= this.totalRows; row++) {
      const rowSeats: CabinSeat[] = [];
      for (const column of this.cabinColumns) {
        const seatNumber = `${row}${column}`;
        const occupied = this.occupiedSeatNumbers.has(seatNumber) && seatNumber !== selectedSeat;
        const isEmergencyExit = row === 12 || row === 13;
        const extraLegroom = row === 1 || row === 12 || row === 13;
        const section = row <= 10 ? 'FRONT' : row >= 25 ? 'BACK' : 'MIDDLE';
        const type = (column === 'A' || column === 'F')
          ? 'WINDOW'
          : (column === 'C' || column === 'D' ? 'AISLE' : 'MIDDLE');

        rowSeats.push({
          seatNumber,
          row,
          column,
          occupied,
          isEmergencyExit,
          extraLegroom,
          section,
          type
        });
      }
      rows.push(rowSeats);
    }

    this.cabinRows = rows;
  }

  selectSeat(seat: CabinSeat): void {
    if (seat.occupied || this.loading) {
      return;
    }

    this.joinForm.patchValue({
      seat_number: seat.seatNumber,
      is_emergency_exit: seat.isEmergencyExit,
      extra_legroom: seat.extraLegroom
    });

    this.buildCabinRows();
  }

  isSeatSelected(seat: CabinSeat): boolean {
    const selectedSeat = (this.joinForm.get('seat_number')?.value || '').toUpperCase();
    return selectedSeat === seat.seatNumber;
  }

  trackRow(_: number, row: CabinSeat[]): number {
    return row[0]?.row || 0;
  }

  trackSeat(_: number, seat: CabinSeat): string {
    return seat.seatNumber;
  }

  getSelectedSeatLabel(): string {
    return (this.joinForm.get('seat_number')?.value || '').toUpperCase() || 'Sin seleccionar';
  }

  onSubmit(): void {
    if (this.joinForm.valid && this.flight) {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser?.id) {
        this.snackBar.open('Debes iniciar sesión para continuar', 'Cerrar', { duration: 3500 });
        this.router.navigate(['/auth/login']);
        return;
      }

      this.loading = true;

      const formValue = this.joinForm.value;
      
      const joinRequest: JoinFlightRequest = {
        user_id: currentUser.id,
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
          if (seat) {
            if (this.bookingFlow) {
              this.createBookingAfterSeatJoin(seat.seat_number);
              return;
            }

            this.loading = false;
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

  private createBookingAfterSeatJoin(seatNumber: string): void {
    if (!this.flight) {
      this.loading = false;
      return;
    }

    const bookingFlight = {
      id: this.flight.id,
      flight_number: this.flight.flight_number,
      departure_code: this.flight.departure?.airport_code || (this.flight as any)?.departure_code,
      arrival_code: this.flight.arrival?.airport_code || (this.flight as any)?.arrival_code,
      departure_time: this.flight.departure?.time || (this.flight as any)?.departure_time,
      arrival_time: this.flight.arrival?.time || (this.flight as any)?.arrival_time,
      seat_number: seatNumber
    };

    this.bookingService.createBooking(bookingFlight).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Reserva creada con asiento confirmado', 'OK', { duration: 3500 });
        this.router.navigate(['/bookings']);
      },
      error: (error) => {
        this.loading = false;
        const message = error?.error?.error || 'Asiento registrado, pero no se pudo crear la reserva';
        this.snackBar.open(message, 'Cerrar', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    if (this.flight) {
      this.router.navigate(['/flights', this.flight.id]);
    } else {
      this.router.navigate(['/flights']);
    }
  }

  getDepartureDisplay(): string {
    if (!this.flight) {
      return '-';
    }
    return this.flight.departure?.city || (this.flight as any)?.departure_code || '-';
  }

  getArrivalDisplay(): string {
    if (!this.flight) {
      return '-';
    }
    return this.flight.arrival?.city || (this.flight as any)?.arrival_code || '-';
  }
}
