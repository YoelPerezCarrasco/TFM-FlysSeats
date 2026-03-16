import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BookingService, Booking } from '../../../core/services/booking.service';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './bookings-list.component.html',
  styleUrls: ['./bookings-list.component.scss']
})
export class BookingsListComponent implements OnInit {
  bookings: Booking[] = [];
  loading = false;

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load bookings', error);
        this.loading = false;
      }
    });
  }

  cancelBooking(id: string): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.cancelBooking(id).subscribe({
        next: () => this.loadBookings(),
        error: (error) => console.error('Failed to cancel booking', error)
      });
    }
  }

  getBookingCode(booking: Booking): string {
    return booking.bookingNumber || booking.id || '-';
  }

  getPassengerLabel(booking: Booking): string {
    return booking.userId || '-';
  }

  getRoute(booking: Booking): string {
    const departure = booking.flight?.departure_code || '-';
    const arrival = booking.flight?.arrival_code || '-';
    return `${departure} → ${arrival}`;
  }

  getFlightNumber(booking: Booking): string {
    return booking.flight?.flight_number || '-';
  }

  getSeatLabel(booking: Booking): string {
    return booking.flight?.seat_number || 'N/A';
  }

  getFlightId(booking: Booking): string {
    const candidate = booking.flight?.id || booking.flight?.flight_id || '';
    if (!candidate || /^mock/i.test(candidate) || candidate === 'amadeus') {
      return '';
    }
    return candidate;
  }

  hasSeatAssigned(booking: Booking): boolean {
    return !!booking.flight?.seat_number;
  }

  getStatusLabel(status: Booking['status']): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  canRequestSwap(booking: Booking): boolean {
    return booking.status === 'confirmed' && !!this.getFlightId(booking);
  }

  goToSwapSuggestions(booking: Booking): void {
    const flightId = this.getFlightId(booking);
    if (!flightId) {
      return;
    }

    this.router.navigate(['/swaps/flight', flightId]);
  }

  goToSeatSetup(booking: Booking): void {
    const flightId = this.getFlightId(booking);
    if (!flightId) {
      return;
    }

    this.router.navigate(['/flights', flightId, 'join']);
  }
}
