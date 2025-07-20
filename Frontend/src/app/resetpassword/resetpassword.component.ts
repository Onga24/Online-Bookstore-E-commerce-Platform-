import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PasswordMatchValidator } from '../../shared/validators/password_match_validator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './resetpassword.component.html',
  styleUrl: './resetpassword.component.css',
})
export class ResetpasswordComponent implements OnInit {
  resetForm!: FormGroup;
  isSubmitted = false;
  returnUrl = '';
  token: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router,
    private activeRoute: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.resetForm = this.formBuilder.group(
      {
        password: ['', [Validators.required, Validators.minLength(5)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: PasswordMatchValidator('password', 'confirmPassword'),
      }
    );
    this.token = this.activeRoute.snapshot.paramMap.get('token') || '';
  }
  get fc() {
    return this.resetForm.controls;
  }

  submit() {
    this.isSubmitted = true;
    if (this.resetForm.invalid) return;
    this.userService
      .resetPassword({
        password: this.fc['password'].value,
        token: this.token,
      })
      .subscribe(() => {
        this.router.navigateByUrl(this.returnUrl);
      });
  }
}
