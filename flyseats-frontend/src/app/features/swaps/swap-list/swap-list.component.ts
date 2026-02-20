import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SwapService } from '../../../core/services/swap.service';
import { AuthService } from '../../../core/services/auth.service';
import { SwapRequest } from '../../../core/models';

@Component({
  selector: 'app-swap-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './swap-list.component.html',
  styleUrls: ['./swap-list.component.scss']
})
export class SwapListComponent implements OnInit {
  swaps: SwapRequest[] = [];
  loading = true;
  userId = '';
  processing = false;

  constructor(
    private router: Router,
    private swapService: SwapService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.userId = user.id;
    this.loadSwaps();
  }

  loadSwaps(): void {
    this.loading = true;
    this.swapService.getUserSwaps(this.userId).subscribe({
      next: (swaps) => {
        this.swaps = swaps;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get pendingSwaps(): SwapRequest[] {
    return this.swaps.filter(s => s.status === 'pending' || s.status === 'accepted');
  }

  get completedSwaps(): SwapRequest[] {
    return this.swaps.filter(s => s.status === 'completed');
  }

  get rejectedSwaps(): SwapRequest[] {
    return this.swaps.filter(s => s.status === 'rejected' || s.status === 'expired');
  }

  isRequester(swap: SwapRequest): boolean {
    return swap.requester.user_id === this.userId;
  }

  isPartner(swap: SwapRequest): boolean {
    return swap.partner.user_id === this.userId;
  }

  hasConfirmed(swap: SwapRequest): boolean {
    if (this.isRequester(swap)) return swap.requester_confirmed;
    if (this.isPartner(swap)) return swap.partner_confirmed;
    return false;
  }

  needsAction(swap: SwapRequest): boolean {
    return (swap.status === 'pending' || swap.status === 'accepted') && !this.hasConfirmed(swap);
  }

  acceptSwap(swap: SwapRequest): void {
    if (this.processing) return;
    this.processing = true;

    this.swapService.acceptSwap(swap.id, this.userId).subscribe({
      next: (updated) => {
        this.processing = false;
        const idx = this.swaps.findIndex(s => s.id === swap.id);
        if (idx >= 0) this.swaps[idx] = updated;

        if (updated.status === 'completed') {
          this.snackBar.open('¡Intercambio completado con éxito!', 'OK', { duration: 5000 });
        } else {
          this.snackBar.open('Has aceptado el intercambio. Esperando confirmación del otro pasajero.', 'OK', { duration: 4000 });
        }
      },
      error: (error) => {
        this.processing = false;
        this.snackBar.open(error.error?.error || 'Error aceptando swap', 'Cerrar', { duration: 4000 });
      }
    });
  }

  rejectSwap(swap: SwapRequest): void {
    if (this.processing) return;
    this.processing = true;

    this.swapService.rejectSwap(swap.id, this.userId).subscribe({
      next: (updated) => {
        this.processing = false;
        const idx = this.swaps.findIndex(s => s.id === swap.id);
        if (idx >= 0) this.swaps[idx] = updated;
        this.snackBar.open('Intercambio rechazado', 'OK', { duration: 3000 });
      },
      error: (error) => {
        this.processing = false;
        this.snackBar.open(error.error?.error || 'Error rechazando swap', 'Cerrar', { duration: 4000 });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'accepted': return '#2196f3';
      case 'completed': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'expired': return '#9e9e9e';
      default: return '#a0aec0';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'accepted': return 'Aceptado (1/2)';
      case 'completed': return 'Completado';
      case 'rejected': return 'Rechazado';
      case 'expired': return 'Expirado';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'hourglass_empty';
      case 'accepted': return 'check_circle_outline';
      case 'completed': return 'check_circle';
      case 'rejected': return 'cancel';
      case 'expired': return 'timer_off';
      default: return 'help';
    }
  }
}
