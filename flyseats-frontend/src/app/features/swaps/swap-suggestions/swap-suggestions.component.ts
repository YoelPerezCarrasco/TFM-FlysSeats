import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SwapService, SwapSuggestion } from '../../../core/services/swap.service';
import { AuthService } from '../../../core/services/auth.service';
import { Seat } from '../../../core/models';

@Component({
  selector: 'app-swap-suggestions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  templateUrl: './swap-suggestions.component.html',
  styleUrls: ['./swap-suggestions.component.scss']
})
export class SwapSuggestionsComponent implements OnInit {
  flightId = '';
  suggestions: SwapSuggestion[] = [];
  yourSeat: Seat | null = null;
  loading = true;
  requesting = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private swapService: SwapService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.flightId = this.route.snapshot.paramMap.get('flightId') || '';
    if (this.flightId) {
      this.loadSuggestions();
    }
  }

  loadSuggestions(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'Debes iniciar sesión para ver sugerencias';
      this.loading = false;
      return;
    }

    this.swapService.getSwapSuggestions(this.flightId, user.id).subscribe({
      next: (response) => {
        this.suggestions = response.suggestions;
        this.yourSeat = response.your_seat;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.error || 'Error cargando sugerencias';
        if (error.error?.code === 'NO_PREFERENCES') {
          this.errorMessage = 'Configura tus preferencias de asiento primero';
        }
      }
    });
  }

  requestSwap(suggestion: SwapSuggestion): void {
    if (!this.yourSeat || this.requesting) return;
    
    this.requesting = true;
    this.swapService.createSwapRequest(
      this.flightId,
      this.yourSeat.id,
      suggestion.partner_seat.id
    ).subscribe({
      next: (swap) => {
        this.requesting = false;
        this.snackBar.open(
          `Solicitud de intercambio enviada a ${suggestion.partner_user.name}`,
          'OK',
          { duration: 4000 }
        );
        // Remove from suggestions after requesting
        this.suggestions = this.suggestions.filter(
          s => s.partner_seat.id !== suggestion.partner_seat.id
        );
      },
      error: (error) => {
        this.requesting = false;
        this.snackBar.open(
          error.error?.error || 'Error enviando solicitud',
          'Cerrar',
          { duration: 4000 }
        );
      }
    });
  }

  getScoreColor(score: number): string {
    if (score >= 70) return '#4caf50';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  }

  getScoreLabel(score: number): string {
    if (score >= 70) return 'Excelente match';
    if (score >= 50) return 'Buen match';
    if (score >= 30) return 'Match razonable';
    return 'Match bajo';
  }

  getSeatTypeIcon(type: string): string {
    switch (type) {
      case 'WINDOW': return 'panorama';
      case 'AISLE': return 'directions_walk';
      case 'MIDDLE': return 'person';
      default: return 'event_seat';
    }
  }

  getSeatTypeLabel(type: string): string {
    switch (type) {
      case 'WINDOW': return 'Ventana';
      case 'AISLE': return 'Pasillo';
      case 'MIDDLE': return 'Centro';
      default: return type;
    }
  }

  getSectionLabel(section: string): string {
    switch (section) {
      case 'FRONT': return 'Delantera';
      case 'MIDDLE': return 'Central';
      case 'BACK': return 'Trasera';
      default: return section;
    }
  }

  goBack(): void {
    this.router.navigate(['/flights']);
  }
}
