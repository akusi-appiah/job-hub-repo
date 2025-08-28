import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState, withHooks } from '@ngrx/signals';
import { tap,  } from 'rxjs';
import { AuthService } from '../../config/services/authService/auth-service.service'; 
import { UserState } from '../../config/interfaces/general.interface';

// Define a storage key
const USER_STORAGE_KEY = 'user_data';

const initialState: UserState = {
  userId: null,
  userType: null,
  categoryIds: null,
  personalData: null,
  loading: false,
  error: null,
};

export const UserStore = signalStore(
  { providedIn: 'root' }, 
  withState(initialState),

  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.userId()),
    fullName: computed(() => {
      const pd = store.personalData();
      return pd ? `${pd.firstname} ${pd.lastname}` : '';
    }),
  })),

  withMethods((store, authService = inject(AuthService)) => ({
  // Load user data from the auth service
    updateUserData(userData: any) {
      const payload = userData?.tokens?.idToken?.payload;

      const newState=  {
        userId: payload?.sub,
        userType: payload?.["cognito:groups"][0] || 'USER',
        categoryIds: payload?.['custom:job_category_ids'] ? JSON.parse(payload['custom:job_category_ids']) : [],
        personalData: payload?{
          email: payload?.email,
          firstname: payload?.given_name,
          lastname: payload?.family_name,
        }: null,
        loading: false,
      };

      patchState(store, newState);

      // Persist to localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newState));
    },

    clearUserData() {
      patchState(store, initialState);
      localStorage.removeItem(USER_STORAGE_KEY);
    },

    // Load user data from localStorage
    loadFromStorage() {
      try {
        const storedData = localStorage.getItem(USER_STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          patchState(store, parsedData);
          return true;
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      return false;
    },

    logout() {
      patchState(store, { loading: true });
      return authService.logout().pipe(
        tap(() => {
          this.clearUserData();
        }),
      );
    }
  })),

  withHooks({
    onInit({ loadFromStorage }) {
      loadFromStorage();
    },
  })
);