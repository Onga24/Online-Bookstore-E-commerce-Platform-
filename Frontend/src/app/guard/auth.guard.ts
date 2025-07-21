import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { UserService } from '../services/user.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.userService.validateSession().pipe(
      map((isValid) => {
        if (isValid) {
          return true;
        } else {
          this.router.navigate(['/signin']);
          return false;
        }
      }),
      catchError((error) => {
        this.router.navigate(['/signin']);
        return of(false);
      })
    );
  }
}
