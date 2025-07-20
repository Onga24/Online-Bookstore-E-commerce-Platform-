import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, of } from 'rxjs';
import { User } from '../../shared/model/User';
import { IUserLogin } from '../../shared/interfaces/IUserLogin';
import { HttpClient } from '@angular/common/http';
import {
  USER_AUTH_CHECK_URL,
  USER_FORGOT_PASSWORD_URL,
  USER_GOOGLE_REGISTER_URL,
  USER_LOGIN_URL,
  USER_REGISTER_URL,
  USER_RESET_PASSWORD_URL,
  USER_VERIFY_EMAIL_URL,
} from '../../shared/const/urls';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { IUserRegister } from '../../shared/interfaces/IUserRegister';
import { map, catchError } from 'rxjs/operators';

const USER_KEY = 'User';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject = new BehaviorSubject<User>(this.getUserToLocalStorage());
  public userObservable: Observable<User>;
  constructor(private http: HttpClient, private toastrService: ToastrService) {
    this.userObservable = this.userSubject.asObservable();
  }
  login(userLogin: IUserLogin): Observable<User> {
    return this.http
      .post<User>(USER_LOGIN_URL, userLogin, { withCredentials: true })
      .pipe(
        tap({
          next: (user) => {
            this.setUserToLocalStorage(user);
            this.userSubject.next(user);
            this.toastrService.success(
              `Welcome Again ${user.firstName}!`,
              'Login Succesfully'
            );
          },
          error: (errorResponse) => {
            this.toastrService.error(errorResponse.error, 'Login Failed');
          },
        })
      );
  }

  register(userRegister: IUserRegister): Observable<User> {
    return this.http.post<User>(USER_REGISTER_URL, userRegister).pipe(
      tap({
        next: (user) => {
          this.setUserToLocalStorage(user);
          this.userSubject.next(user);
          this.toastrService.success(
            `Welcome Again ${user.firstName}!`,
            'Register Succesfully'
          );
        },
        error: (errorResponse) => {
          this.toastrService.error(errorResponse.error, 'Register Failed');
        },
      })
    );
  }

  // googleRegister(): Observable<any> {
  //   return this.http.get<any>(USER_GOOGLE_REGISTER_URL).pipe(
  //     tap({
  //       next: (user) => {
  //         this.setUserToLocalStorage(user);
  //         this.userSubject.next(user);
  //         this.toastrService.success(
  //           `Welcome Again ${user.firstName}!`,
  //           'Register Succesfully'
  //         );
  //       },
  //       error: (errorResponse) => {
  //         this.toastrService.error(
  //           errorResponse.error,
  //           'Register with Google Failed'
  //         );
  //       },
  //     })
  //   );
  // }

  // githubRegister(): Observable<User> {
  //   return this.http.post<User>(USER_REGISTER_URL, userRegister).pipe(
  //     tap({
  //       next: (user) => {
  //         this.setUserToLocalStorage(user);
  //         this.userSubject.next(user);
  //         this.toastrService.success(
  //           `Welcome Again ${user.firstName}!`,
  //           'Register Succesfully'
  //         );
  //       },
  //       error: (errorResponse) => {
  //         this.toastrService.error(errorResponse.error, 'Register Failed');
  //       },
  //     })
  //   );
  // }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http.post(USER_FORGOT_PASSWORD_URL, data).pipe(
      tap({
        next: (res) => {
          this.toastrService.success(
            `Reset email sent successfully to ${data.email}`
          );
        },
        error: (errorResponse) => {
          this.toastrService.error(
            errorResponse.error,
            'Error sending reset email'
          );
        },
      })
    );
  }

  verifyEmail(data: { code: number }): Observable<any> {
    return this.http.post(USER_VERIFY_EMAIL_URL, data).pipe(
      tap({
        next: (res) => {
          this.toastrService.success(`You Verified Succesfully`);
        },
        error: (errorResponse) => {
          this.toastrService.error(
            errorResponse.error,
            'The Verefied Code is Incorrect'
          );
        },
      })
    );
  }

  resetPassword(data: { password: string; token: string }) {
    return this.http
      .post(`${USER_RESET_PASSWORD_URL}/${data.token}`, data)
      .pipe(
        tap({
          next: (res) => {
            this.toastrService.success(`You Reset password Succesfully`);
          },
          error: (errorResponse) => {
            this.toastrService.error(
              errorResponse.error,
              'Error In password Reset'
            );
          },
        })
      );
  }

  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  validateSession(): Observable<boolean> {
    return this.http.get(USER_AUTH_CHECK_URL, { withCredentials: true }).pipe(
      map((res: any) => res.success && !!res.user),
      catchError((error) => {
        console.error('Session check failed:', error);
        this.toastrService.error(
          error?.error?.message || 'Session check failed',
          'Auth Error'
        );
        return of(false);
      })
    );
  }

  logout() {
    this.userSubject.next(new User());
    localStorage.removeItem(USER_KEY);
    window.location.reload();
  }
  private setUserToLocalStorage(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private getUserToLocalStorage(): User {
    const userJson = localStorage.getItem(USER_KEY);
    if (userJson) return JSON.parse(userJson) as User;
    return new User();
  }
}
