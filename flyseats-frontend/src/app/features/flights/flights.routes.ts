import { Routes } from '@angular/router';
import { FlightSearchComponent } from './flight-search/flight-search.component';
import { FlightCreateComponent } from './flight-create/flight-create.component';
import { FlightDetailComponent } from './flight-detail/flight-detail.component';
import { FlightJoinComponent } from './flight-join/flight-join.component';

export const FLIGHTS_ROUTES: Routes = [
  {
    path: '',
    component: FlightSearchComponent
  },
  {
    path: 'create',
    component: FlightCreateComponent
  },
  {
    path: ':id',
    component: FlightDetailComponent
  },
  {
    path: ':id/join',
    component: FlightJoinComponent
  }
];
