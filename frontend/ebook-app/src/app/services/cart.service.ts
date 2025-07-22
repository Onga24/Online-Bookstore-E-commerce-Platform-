// src/app/services/cart.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface Book {
  _id: string;
  title: string;
  price: number;
  coverImage?: string;
}

export interface CartItem {
  book: Book;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  items: CartItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private baseUrl = 'http://localhost:5000/api/cart';

  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  private totalSubject = new BehaviorSubject<number>(0);
  public total$ = this.totalSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** ✅ Call this once in ngOnInit to load the cart */
  loadCart(): void {
    this.http.get<CartResponse>(this.baseUrl).pipe(
      tap(response => {
        if (response.success) {
          this.cartItemsSubject.next(response.items);
          this.calculateTotal(response.items);
        }
      })
    ).subscribe();
  }

  /** ✅ Calculate total from items */
  private calculateTotal(items: CartItem[]): void {
    const total = items.reduce((acc, item) => acc + item.book.price * item.quantity, 0);
    this.totalSubject.next(total);
  }

  /** ✅ Delete item from backend and update local state */
  deleteItem(bookId: string): void {
    this.http.delete(`${this.baseUrl}/${bookId}`).subscribe(() => {
      const updatedItems = this.cartItemsSubject.getValue().filter(item => item.book._id !== bookId);
      this.cartItemsSubject.next(updatedItems);
      this.calculateTotal(updatedItems);
    });
  }

  createOrder() {
  return this.http.post<any>('http://localhost:5000/api/orders/create', {});
}

captureOrder(paypalOrderId: string, orderId: string) {
  return this.http.post<any>('http://localhost:5000/api/orders/capture', {
    paypalOrderId,
    orderId
  });
}
}
