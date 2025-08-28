import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, of, defer } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';

import { 
  signUp as amplifySignUp, 
  signIn as amplifySignIn, 
  signOut as amplifySignOut,
  getCurrentUser,
  confirmSignUp as amplifyConfirmSignUp,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  deleteUser as amplifyDeleteUser,
  fetchUserAttributes,
  updateUserAttributes,
  updatePassword,
  UpdateUserAttributesOutput,
  confirmUserAttribute,
  type VerifiableUserAttributeKey,
  fetchAuthSession
} from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.init();
  }

  public async init(): Promise<void> {
    await this.checkAuthState();
  }

  private async checkAuthState(): Promise<void> {
    try {
     await getCurrentUser();
      this.isAuthenticatedSubject.next(true);
    } catch (error) {
      this.isAuthenticatedSubject.next(false);
      console.error('Error checking auth state:', error);
    }
  }

  signUp(data: {email: string; password: string; firstName?: string; middleName?: string; lastName?: string;phoneNumber?: string; jobPreferences?: string[] }): Observable<any> {
    
    const signUpPayload={
      username: data.email,
      password: data.password,
      options: {
        userAttributes: {
          email: data.email,
          ...(data.firstName && { given_name: data.firstName }),
          ...(data.phoneNumber && { phone_number: data.phoneNumber }),
          ...(data.lastName && { family_name: data.lastName }),
          ...(data.middleName && { middle_name: data.middleName }),   
          ...(data.jobPreferences && { 'custom:job_category_ids': JSON.stringify(data.jobPreferences || []) })         
        }
      }
    }
    
    return from(amplifySignUp(signUpPayload)).pipe(
      // tap((response) => console.log('Sign-up response:', response)),
      catchError(error => {
        console.error('Sign-up error:', error);
        throw error;
      })
    );
  }  
  
  // Add confirmation method for email verification
  confirmSignUp(email: string, code: string): Observable<any> {
    return from(amplifyConfirmSignUp({ username: email, confirmationCode: code })).pipe(
      catchError(error => {
        console.error('Confirmation error:', error);
        throw error;
      })
    );
  }

  signIn(data: { email: string; password: string }): Observable<any> {
    return from(amplifySignIn({ 
      username: data.email, 
      password: data.password 
    })).pipe(
      tap((response) => {
        // console.log('Sign-in response:', response);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError(error => {
        console.error('Sign-in error:', error);
        throw error;
      })
    );
  }

  fetchAuthSession(): Observable<any> {
    return from(fetchAuthSession()).pipe(
      catchError(error => {
        console.error('Fetch auth session error:', error);
        throw error;
      }) 
    );    
  };

  forgotPassword(email: string): Observable<any> {
    return from(amplifyResetPassword({ username: email })).pipe(
      catchError(error => {
        console.error('Forgot password error:', error);
        throw error;
      })
    );
  }

  confirmResetPassword(email: string, code: string, newPassword: string): Observable<any> {
    return from(amplifyConfirmResetPassword({ username: email, confirmationCode: code, newPassword })).pipe(
      catchError(error => {
        console.error('Confirm reset password error:', error);
        throw error;
      })
    );
  }

  logout(): Observable<any> {
    return from (amplifySignOut()).pipe(
    tap(() => {
        this.isAuthenticatedSubject.next(false);
      }),
      catchError(error => {
        // console.error('Logout error:', error);
        this.isAuthenticatedSubject.next(false);
        return of(null);
      })
    );  
  }


  isLoggedIn(): Observable<boolean> {
    return from(getCurrentUser()).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  deleteUser(): Observable<any> {
    return from(getCurrentUser()).pipe(
      switchMap(user => 
        from(amplifyDeleteUser()).pipe(
          switchMap(() => 
            from(fetch('/api/delete-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.username })
            })).pipe(
              map(() => ({ success: true })),
              catchError(error => {
                console.error('DynamoDB cleanup error:', error);
                throw error;
              })
            )
          ),
          tap(() => {
            this.isAuthenticatedSubject.next(false);
            console.log('User deleted successfully');
          }),
          catchError(error => {
            console.error('Delete user error:', error);
            throw error;
          })
        )
      )
    );
  }

  getUserAttributes(): Observable<{
    firstName: string;
    middleName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    jobPreferences: string[];
  }> {
    return from(fetchUserAttributes()).pipe(
      map(attributes => ({
        firstName: attributes.given_name || '',
        middleName: attributes.middle_name || '',
        lastName: attributes.family_name || '',
        email: attributes.email || '',
        phoneNumber: attributes.phone_number || '',
        jobPreferences: attributes['custom:job_category_ids'] ? JSON.parse(attributes['custom:job_category_ids']) : []
      })),
      catchError(error => {
        console.error('Get user attributes error:', error);
        throw error;
      })    );
  }

  updateUserAttributes(updates: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    phoneNumber?: string;
    jobPreferences?: string[];
  }): Observable<UpdateUserAttributesOutput> {

  const attributesPayload = {
    userAttributes: {
      ...(updates.firstName && { given_name: updates.firstName }),
      ...(updates.middleName && { middle_name: updates.middleName }),
      ...(updates.lastName && { family_name: updates.lastName }),
      ...(updates.phoneNumber && { phone_number: updates.phoneNumber }),
      ...(updates.jobPreferences && { 'custom:job_category_ids': JSON.stringify(updates.jobPreferences) })
    }
  };
    return defer(async () => {
      const result = await updateUserAttributes(attributesPayload);
      console.log('User attributes updated successfully:', result);
      return result; 
    }).pipe(
      catchError(error => {
        console.error('Update user attributes error:', error);
        throw error;
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<{ success: boolean }> {
    return defer(async () => {
      await updatePassword({ oldPassword, newPassword });
      console.log('Password changed successfully');
      return { success: true }; 
    }).pipe(
      catchError(error => {
        console.error('Change password error:', error);
        throw error;
      })
    );
  }

  confirmUserAttribute(attributeKey: VerifiableUserAttributeKey, confirmationCode: string): Observable<any> {
    return from(confirmUserAttribute({ userAttributeKey: attributeKey , confirmationCode })).pipe(
      tap(() => console.log(`${attributeKey} verified successfully`)),
      catchError(error => {
        console.error('Confirm attribute error:', error);
        throw error;
      })
    );
  }
}
