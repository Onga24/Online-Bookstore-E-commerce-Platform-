import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Route, Router, RouterModule } from '@angular/router';
import { UserService } from '../services/user.service';
import { PasswordMatchValidator } from '../../shared/validators/password_match_validator';
import { IUserRegister } from '../../shared/interfaces/IUserRegister';
import { CommonModule } from '@angular/common';
import { ToastrService, ToastrModule } from 'ngx-toastr';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  registerForm!: FormGroup;
  isSubmitted: boolean = false;
  returnUrl = '/';

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private activateRoute: ActivatedRoute,
    private router: Router,
    private toastrService: ToastrService
  ) {}
  ngOnInit(): void {
    console.log('SignupComponent loaded');

    const queryParams = this.activateRoute.snapshot.queryParams;
    console.log('Query Params:', queryParams);
    this.registerForm = this.formBuilder.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(5)]],
        lastName: ['', [Validators.required, Validators.minLength(5)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(5)]],
        confirmPassword: ['', [Validators.required]],
        address: ['', [Validators.required, Validators.minLength(10)]],
      },
      {
        validators: PasswordMatchValidator('password', 'confirmPassword'),
      }
    );
    // const queryParams = this.activateRoute.snapshot.queryParams;
    const socialStatus = queryParams['social'];

    if (socialStatus === 'success') {
      const name = queryParams['firstName'] || 'User';
      this.toastrService.success(
        `Welcome back, ${name}!`,
        'Social Login Success'
      );
      this.router.navigate([], {
        queryParams: {},
        replaceUrl: true,
      });
    }

    if (socialStatus === 'fail') {
      this.toastrService.error(
        'Social login failed. Please try again.',
        'Login Error'
      );
      this.router.navigate([], {
        queryParams: {},
        replaceUrl: true,
      });
    }
  }
  get fc() {
    return this.registerForm.controls;
  }

  submit() {
    this.isSubmitted = true;
    if (this.registerForm.invalid) return;

    const fv = this.registerForm.value;
    const user: IUserRegister = {
      firstName: fv.firstName,
      lastName: fv.lastName,
      email: fv.email,
      password: fv.password,
      confirmPassword: fv.confirmPassword,
      address: fv.address,
    };

    this.userService.register(user).subscribe((_) => {
      this.router.navigate(['/verify-otp'], {
        queryParams: { email: this.fc['email'].value },
      });
    });
  }
  socialSignUp(provider: 'google' | 'github' | 'facebook') {
    window.location.href = `http://localhost:5000/api/users/auth/${provider}`;
  }
  // socialSignUpGithub() {
  //   this.userService.githubRegister;
  // }
}
