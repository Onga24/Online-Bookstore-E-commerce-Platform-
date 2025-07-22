// src/app/pages/order/payment-summary/payment-summary.component.ts
import { Component, OnInit } from '@angular/core';
import { CartService } from '../../../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  templateUrl: './payment-summary.component.html',
  styleUrls: ['./payment-summary.component.css']
})
export class PaymentSummaryComponent implements OnInit {
  total = 0;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    this.cartService.total$.subscribe((value: number) => {
      this.total = value;
    });

    const urlParams = new URLSearchParams(window.location.search);
    const paypalOrderId = urlParams.get('token');
    const orderId = localStorage.getItem('lastOrderId');

    if (paypalOrderId && orderId) {
      this.cartService.captureOrder(paypalOrderId, orderId).subscribe({
        next: (res) => {
          alert('Payment Successful!');
          localStorage.removeItem('lastOrderId');
          this.router.navigate(['/orders']); // or a thank-you page
        },
        error: (err) => {
          alert('Payment capture failed.');
          console.error(err);
        }
      });
    }
  }

  startPayment(): void {
    this.cartService.createOrder().subscribe({
      next: (res) => {
        if (res.success && res.approvalUrl) {
          localStorage.setItem('lastOrderId', res.orderId);
          window.location.href = res.approvalUrl;
        }
      },
      error: (err) => {
        alert('Error creating PayPal order.');
        console.error(err);
      }
    });
  }
}
