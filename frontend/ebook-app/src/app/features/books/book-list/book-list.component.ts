import { Component, OnInit, OnDestroy } from '@angular/core'; // Removed unused imports for brevity
import { CommonModule,  } from '@angular/common';
import { Router , RouterLink , RouterModule} from '@angular/router'; // <--- Make sure this import is present!
import { Subscription } from 'rxjs';

import { BookService, BookData } from '../../../core/services/book.service';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule ,RouterLink],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css'
})
export class BookListComponent implements OnInit, OnDestroy {
  books: BookData[] = [];
  isLoading: boolean = false;
  successMessage: string = '';
  private booksSubscription: Subscription | undefined;
  private feedbackMessageSubscription: Subscription | undefined;

  // Make sure your constructor looks exactly like this:
  constructor(
    private bookService: BookService,
    private router: Router // <--- This line is critical for injecting the Router service
  ) { }

  ngOnInit(): void {
    this.fetchBooks();

    this.feedbackMessageSubscription = this.bookService.successMessage$.subscribe(
      message => {
        this.successMessage = message;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.booksSubscription) {
      this.booksSubscription.unsubscribe();
    }
    if (this.feedbackMessageSubscription) {
      this.feedbackMessageSubscription.unsubscribe();
    }
  }

  fetchBooks(): void {
    this.isLoading = true;
    this.booksSubscription = this.bookService.getBooks().subscribe({
      next: (data: BookData[]) => {
        this.books = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching books:', error);
        this.isLoading = false;
        this.bookService.setFeedbackMessage('❌ Failed to load books.');
      }
    });
  }

  editBook(bookId: string | undefined): void {
    if (bookId) {
      this.router.navigate(['/edit-book', bookId]); // This is where 'this.router' is used
      this.bookService.scrollToTop();
    } else {
      this.bookService.setFeedbackMessage('❌ Cannot edit: Book ID is missing.');
    }
  }
   
  viewBookDetails(bookId: string): void {
    this.router.navigate(['/book-details', bookId]);
  }

  deleteBook(bookId: string | undefined, bookTitle: string): void {
    if (!bookId) {
      this.bookService.setFeedbackMessage('❌ Cannot delete: Book ID is missing.');
      return;
    }

    if (confirm(`Are you sure you want to delete the book "${bookTitle}"? This action cannot be undone.`)) {
      this.isLoading = true;
      this.bookService.deleteBook(bookId).subscribe({
        next: () => {
          this.bookService.setFeedbackMessage(`✅ Book "${bookTitle}" deleted successfully!`);
          this.fetchBooks();
        },
        error: (error) => {
          console.error('Error deleting book:', error);
          this.isLoading = false;
          this.bookService.setFeedbackMessage(`❌ Failed to delete book "${bookTitle}": ` + (error.error?.message || error.message));
        }
      });
    }
  }
}
