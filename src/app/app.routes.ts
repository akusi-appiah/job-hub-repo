import { Routes } from '@angular/router';
import { SignupComponent } from './auth/signup/signup.component';
import { SigninComponent } from './auth/signin/signin.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './config/guard/auth.guard';
import { guestGuard } from './config/guard/guest.guard';
import { AuthLayoutComponent } from './pages/layout/auth-layout/auth-layout.component';
import { LandingComponent } from './pages/landing/landing.component';
import { DashboardLayoutComponent } from './pages/layout/dashboard-layout/dashboard-layout.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'signup', component: SignupComponent, canActivate: [guestGuard] },
      { path: 'signin', component: SigninComponent, canActivate: [guestGuard] },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent,
        canActivate: [guestGuard],
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        canActivate: [guestGuard],
      },
      // Redirect invalid auth paths
      { path: '**', redirectTo: 'signin' },
    ],
  },
  // Protected routes (only for authenticated)
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'jobs', loadComponent: () => 
        import('./pages/jobs/job-seekers-board/job-seekers-board.component').then(
          m => m.JobSeekersBoardComponent
        ) 
      },
      {
        path: 'manage-jobs',
        loadComponent: () =>
          import('./pages/jobs/job-owners-board/job-owners-board.component').then(
            (m) => m.JobOwnersBoardComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
    ],
  },
  {
    path: '**',
    canActivate: [authGuard],
    children: [],
  },
];
