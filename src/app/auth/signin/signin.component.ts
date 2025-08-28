import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink,ActivatedRoute} from '@angular/router';
import { AuthService } from '../../config/services/authService/auth-service.service';
import { BackdropComponent } from '../../pages/layout/backdrop/backdrop.component';
import { UserStore } from '../../store/user/user.store';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,BackdropComponent],
  templateUrl: './signin.component.html',
   styles: [`
    .form-input {
      @apply w-full px-4 py-2 border rounded border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400;
    }

    .btn-primary {
      @apply bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700;
    }
  `]

})
export class SigninComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  errorMessage = '';
  loading = false;
  authSession: any = null;
  userStore= inject(UserStore);

  constructor(
    private readonly fb: FormBuilder, 
    private readonly router: Router , 
    private readonly route:ActivatedRoute, 
    private readonly authService: AuthService,
  ) {}

  ngOnInit() {
    this.form.reset(); 
        // Check if we already have user data in storage
    if (this.userStore.isAuthenticated()) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
      this.router.navigate([returnUrl]);
    }
  }

  onSubmit() {
 if (this.form.valid) {
      this.loading = true;
      const { email, password } = this.form.value;
      
      this.authService.signIn({email: email!, password: password!}).subscribe({
        next: () => {
         this.authService.fetchAuthSession().subscribe(userData=>{
          this.userStore.updateUserData(userData);
         });
          
          this.loading = false;
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
          this.router.navigate([returnUrl]);
        },
        error: err => {
          this.errorMessage = err.message || 'Login failed';
          this.loading = false;
        }
      });
    }
  }
}
