import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink,ActivatedRoute} from '@angular/router';
import { AuthService } from '../../config/services/authService/auth-service.service';
import { BackdropComponent } from '../../pages/layout/backdrop/backdrop.component';


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

  constructor(
    private readonly fb: FormBuilder, 
    private readonly router: Router , 
    private readonly route:ActivatedRoute, 
    private readonly authService: AuthService
  ) {}

  ngOnInit() {
    this.form.reset(); 
  }

  onSubmit() {
    if (this.form.valid) {
      const { email, password } = this.form.value;
      this.authService.signIn({email: email!, password: password!}).subscribe({
        next: (result) => {
          console.log('Sign in result:', result);
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
          this.router.navigate([returnUrl]);
        },
        error: err => this.errorMessage = err.message || 'Login failed'
      });
    }
  }
}
