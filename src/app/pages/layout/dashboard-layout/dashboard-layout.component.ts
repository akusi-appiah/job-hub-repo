import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../config/services/authService/auth-service.service';
import { UserStore } from '../../../store/user/user.store';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styles: [`
    .nav-link { @apply block px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-600 hover:text-white transition; }
    .nav-active { @apply bg-blue-600 text-white; }
    .btn-primary { @apply inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg shadow-md hover:bg-brand-primary-dark transition; }
    .btn-ghost { @apply inline-flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition; }
    .btn-danger { @apply bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition; }
  `]
})

export class DashboardLayoutComponent {
  mobileOpen = false;
  isLoading = false;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly userStore = inject(UserStore);
  currentRoute = "Dashboard";
  userType = this.userStore.userType()?.toLowerCase() || 'user';


  onClickRouterLink(route: string) {
    this.currentRoute = route;
    this.mobileOpen = false;
  }

  signOut() {
    this.isLoading = true;
    this.userStore.logout().subscribe({
      next: () =>{ 
        this.userStore.clearUserData();
        this.isLoading = false;
        this.router.navigate(['/auth/signin']);
      } ,
      error: () => { this.isLoading = false; }
    });
  }
}
