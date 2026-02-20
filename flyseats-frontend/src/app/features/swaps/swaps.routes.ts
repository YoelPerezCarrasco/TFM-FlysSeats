import { Routes } from '@angular/router';
import { SwapSuggestionsComponent } from './swap-suggestions/swap-suggestions.component';
import { SwapListComponent } from './swap-list/swap-list.component';

export const SWAPS_ROUTES: Routes = [
  {
    path: '',
    component: SwapListComponent
  },
  {
    path: 'flight/:flightId',
    component: SwapSuggestionsComponent
  }
];
