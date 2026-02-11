import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService, User } from './core/services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'flyseats-frontend';
  currentUser$: Observable<User | null>;

  constructor(
    private translate: TranslateService,
    private authService: AuthService
  ) {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

  switchLanguage(lang: string): void {
    this.translate.use(lang);
  }

  logout(): void {
    this.authService.logout();
  }
}
