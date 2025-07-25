import { Routes } from '@angular/router';
import path from 'node:path';
import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { HomeComponent } from './features/Home/home/home.component';
import { FeaturedBooksComponent } from './features/Home/featured-books/featured-books.component';
import { FeaturedWriterComponent } from './features/Home/featured-writer/featured-writer.component';
import { FavoriteReadsComponent } from './features/Home/favorite-reads/favorite-reads.component';
import { CategoryComponent } from './features/Category/category/category.component';
import { WishlistComponent } from './features/wishlist/wishlist.component';
import { PaymentSummaryComponent } from './features/shopping-cart/payment-summary/payment-summary.component';
import { CartComponent } from './features/shopping-cart/cart/cart.component';
import { OrdersItemsComponent } from './features/shopping-cart/orders-items/orders-items.component';
import { BookListComponent } from './features/books/book-list/book-list.component'; // Adjust path if necessary
import { BookFormComponent } from './features/books/book-form/book-form.component'; // <-- You'll need to create this component or use an existing one for your form
import { EditBookComponent } from './features/books/edit-book/edit-book.component'; // <--- Updated path
import { BookDetailsComponent } from './features/books/book-details/book-details.component';



export const routes: Routes = [
    {path: '' , component: HomeComponent},
    { path: 'list', component: BookListComponent },
  { path: 'books', component: BookListComponent },
  { path: 'add-book', component: BookFormComponent },
  { path: 'edit-book/:id', component: EditBookComponent },
  { path: 'book-details/:id', component: BookDetailsComponent },
    {path: 'home' , component: HomeComponent},
    {path: 'category' , component: CategoryComponent},
    {path: 'wishlist' , component: WishlistComponent},
    {path: 'cart' , component: CartComponent},
    {path: 'head' , component: HeaderComponent},
    {path: 'side' , component: SidebarComponent},
    {path: 'foot' , component: FooterComponent},
    {path: 'cart' , component: CartComponent},
    { path: 'orders-items', component: OrdersItemsComponent },
    {path: '**' , component: HomeComponent},
  ]
