import { Component } from '@angular/core';
import { OrdersItemsComponent } from '../orders-items/orders-items.component';
import { PaymentSummaryComponent } from '../payment-summary/payment-summary.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [OrdersItemsComponent,PaymentSummaryComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {

}
