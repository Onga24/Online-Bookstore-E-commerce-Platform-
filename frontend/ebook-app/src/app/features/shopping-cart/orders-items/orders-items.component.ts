import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../../services/cart.service';

@Component({
  selector: 'app-order-items',
  standalone: true,
  imports: [CommonModule], // Needed for *ngFor, *ngIf
  templateUrl: './orders-items.component.html',
})
export class OrderItemsComponent implements OnInit {
  cartItems: CartItem[] = [];
  isLoading = true;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cartItems$.subscribe((items) => {
      this.cartItems = items;
      this.isLoading = false;
    });

    this.cartService.loadCart();
  }

  getTotalPrice(item: CartItem): number {
    return item.book.price * item.quantity;
  }

  getBookImage(book: any): string {
    return book.coverImage || 'https://via.placeholder.com/100x150?text=No+Image';
  }

  removeItem(bookId: string): void {
    this.cartService.deleteItem(bookId);
  }
}
