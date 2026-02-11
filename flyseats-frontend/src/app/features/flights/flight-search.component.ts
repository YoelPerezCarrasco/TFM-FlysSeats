import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { FlightService, Flight, FlightSearchParams } from '../../core/services/flight.service';

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
    TranslateModule
  ],
  template: `
    <div class="flight-search-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ 'flights.search' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>{{ 'flights.from' | translate }}</mat-label>
                <input matInput formControlName="origin" required>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>{{ 'flights.to' | translate }}</mat-label>
                <input matInput formControlName="destination" required>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>{{ 'flights.departure' | translate }}</mat-label>
                <input matInput [matDatepicker]="departurePicker" formControlName="departureDate" required>
                <mat-datepicker-toggle matSuffix [for]="departurePicker"></mat-datepicker-toggle>
                <mat-datepicker #departurePicker></mat-datepicker>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>{{ 'flights.return' | translate }}</mat-label>
                <input matInput [matDatepicker]="returnPicker" formControlName="returnDate">
                <mat-datepicker-toggle matSuffix [for]="returnPicker"></mat-datepicker-toggle>
                <mat-datepicker #returnPicker></mat-datepicker>
              </mat-form-field>
            </div>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'flights.passengers' | translate }}</mat-label>
              <input matInput type="number" formControlName="passengers" min="1" required>
            </mat-form-field>
            
            <button mat-raised-button color="primary" type="submit" [disabled]="!searchForm.valid || loading" class="full-width">
              {{ 'flights.searchButton' | translate }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
      
      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>
      
      <div *ngIf="flights.length > 0" class="results">
        <h2>{{ 'flights.results' | translate }}</h2>
        <mat-card *ngFor="let flight of flights" class="flight-card">
          <mat-card-content>
            <h3>{{ flight.airline }} - {{ flight.flightNumber }}</h3>
            <p>{{ flight.origin }} → {{ flight.destination }}</p>
            <p>{{ flight.departureTime | date:'short' }} - {{ flight.arrivalTime | date:'short' }}</p>
            <p>{{ flight.price | currency }} - {{ flight.availableSeats }} seats available</p>
            <button mat-raised-button color="accent">{{ 'flights.book' | translate }}</button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .flight-search-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
    }
    
    .half-width {
      flex: 1;
    }
    
    .full-width {
      width: 100%;
      margin-top: 16px;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
    
    .results {
      margin-top: 30px;
    }
    
    .flight-card {
      margin-bottom: 16px;
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
    }
  `]
})
export class FlightSearchComponent implements OnInit {
  searchForm: FormGroup;
  flights: Flight[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService
  ) {
    this.searchForm = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      departureDate: ['', Validators.required],
      returnDate: [''],
      passengers: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {}

  onSearch(): void {
    if (this.searchForm.valid) {
      this.loading = true;
      const params: FlightSearchParams = {
        origin: this.searchForm.value.origin,
        destination: this.searchForm.value.destination,
        departureDate: this.searchForm.value.departureDate,
        returnDate: this.searchForm.value.returnDate,
        passengers: this.searchForm.value.passengers
      };
      
      this.flightService.searchFlights(params).subscribe({
        next: (flights) => {
          this.flights = flights;
          this.loading = false;
        },
        error: (error) => {
          console.error('Search failed', error);
          this.loading = false;
        }
      });
    }
  }
}
