import { Routes } from '@angular/router';
import { BookListComponent } from './features/books/book-list/book-list.component'; // Adjust path if necessary
import { BookFormComponent } from './features/books/book-form/book-form.component'; // <-- You'll need to create this component or use an existing one for your form
import { EditBookComponent } from './features/books/edit-book/edit-book.component'; // <--- Updated path
import { BookDetailsComponent } from './features/books/book-details/book-details.component';
export const routes: Routes = [
  { path: 'list', component: BookListComponent },

  { path: '', redirectTo: '/books', pathMatch: 'full' },
  { path: 'books', component: BookListComponent },
  { path: 'add-book', component: BookFormComponent },
  { path: 'edit-book/:id', component: EditBookComponent },
  { path: 'book-details/:id', component: BookDetailsComponent },
  { path: '**', redirectTo: '/books' },
];
