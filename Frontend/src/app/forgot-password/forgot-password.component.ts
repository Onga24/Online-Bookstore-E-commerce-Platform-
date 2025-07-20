import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent implements OnInit {
  forgotForm!: FormGroup;
  isSubmitted = false;
  returnUrl = '';

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.forgotForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      // password: ['', [Validators.required]],
    });
    // this.returnUrl = this.activeRoute.snapshot.queryParams['returnUrl'];
  }
  get fc() {
    return this.forgotForm.controls;
  }

  submit() {
    this.isSubmitted = true;
    if (this.forgotForm.invalid) return;
    this.userService
      .forgotPassword({
        email: this.fc['email'].value,
      })
      .subscribe(() => {
        // this.router.navigate(['/reset-password']);
      });
  }
}
