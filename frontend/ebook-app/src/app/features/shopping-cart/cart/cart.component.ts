import { Component } from '@angular/core';
import { OrderItemsComponent } from '../orders-items/orders-items.component';
import { PaymentSummaryComponent } from '../payment-summary/payment-summary.component';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Book {
  _id: string;
  title: string;
  price: number;
  image?: string;
}

export interface CartItem {
  book: Book;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly apiUrl = 'http://localhost:3000/api/cart';

  constructor(private http: HttpClient) {}

  getCart(): Observable<{ success: boolean; items: CartItem[] }> {
    return this.http.get<{ success: boolean; items: CartItem[] }>(this.apiUrl);
  }
}

@Component({
  selector: 'app-cart',
  standalone: true,
imports: [OrderItemsComponent, PaymentSummaryComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {

}
