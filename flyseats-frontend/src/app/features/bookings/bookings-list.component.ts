import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { BookingService, Booking } from '../../core/services/booking.service';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  template: `
    <div class="bookings-container">
      <h1>{{ 'bookings.title' | translate }}</h1>
      
      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>
      
      <div *ngIf="!loading && bookings.length === 0" class="no-bookings">
        <p>No bookings found</p>
      </div>
      
      <mat-card *ngFor="let booking of bookings" class="booking-card">
        <mat-card-header>
          <mat-card-title>{{ 'bookings.bookingNumber' | translate }}: {{ booking.bookingNumber }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Passenger:</strong> {{ booking.passengerName }}</p>
          <p><strong>Seat:</strong> {{ booking.seatNumber }}</p>
          <p><strong>{{ 'bookings.status' | translate }}:</strong> 
            <mat-chip [class.confirmed]="booking.status === 'confirmed'"
                      [class.pending]="booking.status === 'pending'"
                      [class.cancelled]="booking.status === 'cancelled'">
              {{ booking.status }}
            </mat-chip>
          </p>
          <p><strong>Created:</strong> {{ booking.createdAt | date:'medium' }}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button color="primary">{{ 'bookings.viewDetails' | translate }}</button>
          <button mat-button color="warn" *ngIf="booking.status !== 'cancelled'" (click)="cancelBooking(booking.id)">Cancel</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .bookings-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    h1 {
      margin-bottom: 24px;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      margin-top: 50px;
    }
    
    .no-bookings {
      text-align: center;
      padding: 50px;
      color: #666;
    }
    
    .booking-card {
      margin-bottom: 16px;
    }
    
    mat-chip {
      &.confirmed {
        background-color: #4caf50;
        color: white;
      }
      
      &.pending {
        background-color: #ff9800;
        color: white;
      }
      
      &.cancelled {
        background-color: #f44336;
        color: white;
      }
    }
  `]
})
export class BookingsListComponent implements OnInit {
  bookings: Booking[] = [];
  loading = false;

  constructor(private bookingService: BookingService) {}

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
}
