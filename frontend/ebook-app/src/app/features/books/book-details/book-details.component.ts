import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BookService, BookData } from '../../../core/services/book.service';

// Review interface
export interface Review {
  id?: string;
  bookId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  reviewText: string;
  reviewDate: Date;
  helpful?: number;
}

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-details.component.html',
  styleUrl: './book-details.component.css'
})
export class BookDetailsComponent implements OnInit, OnDestroy {
  book: BookData | null = null;
  bookId: string = '';
  isLoading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  
  // Review related properties
  reviews: Review[] = [];
  reviewForm: FormGroup;
  isSubmittingReview: boolean = false;
  showReviewForm: boolean = false;
  
  // Subscriptions
  private routeSubscription: Subscription | undefined;
  private bookSubscription: Subscription | undefined;
  private reviewSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private formBuilder: FormBuilder
  ) {
    // Initialize review form
    this.reviewForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(2)]],
      userEmail: ['', [Validators.email]],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      reviewText: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.routeSubscription = this.route.params.subscribe(params => {
      this.bookId = params['id'];
      if (this.bookId) {
        this.loadBookDetails();
        this.loadReviews();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) this.routeSubscription.unsubscribe();
    if (this.bookSubscription) this.bookSubscription.unsubscribe();
    if (this.reviewSubscription) this.reviewSubscription.unsubscribe();
  }

  loadBookDetails(): void {
    this.isLoading = true;
    this.bookSubscription = this.bookService.getBookById(this.bookId).subscribe({
      next: (book: BookData) => {
        this.book = book;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching book details:', error);
        this.errorMessage = 'Failed to load book details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadReviews(): void {
    // Mock reviews for demonstration - replace with actual service call
    this.reviews = [
      {
        id: '1',
        bookId: this.bookId,
        userName: 'Sarah Johnson',
        rating: 5,
        reviewText: 'Absolutely loved this book! The characters were well-developed and the plot kept me engaged throughout. Highly recommend to anyone looking for a great read.',
        reviewDate: new Date('2024-01-15'),
        helpful: 12
      },
      {
        id: '2',
        bookId: this.bookId,
        userName: 'Michael Chen',
        rating: 4,
        reviewText: 'Really good book with interesting themes. The writing style was engaging and I found myself thinking about it long after finishing.',
        reviewDate: new Date('2024-01-10'),
        helpful: 8
      }
    ];
  }

  // Review form methods
  toggleReviewForm(): void {
    this.showReviewForm = !this.showReviewForm;
    if (this.showReviewForm) {
      this.clearMessages();
    }
  }

  onSubmitReview(): void {
    if (this.reviewForm.valid) {
      this.isSubmittingReview = true;
      
      const newReview: Review = {
        bookId: this.bookId,
        userName: this.reviewForm.value.userName,
        userEmail: this.reviewForm.value.userEmail,
        rating: this.reviewForm.value.rating,
        reviewText: this.reviewForm.value.reviewText,
        reviewDate: new Date(),
        helpful: 0
      };

      // Mock API call - replace with actual service
      setTimeout(() => {
        this.reviews.unshift(newReview);
        this.successMessage = '✅ Review submitted successfully! Thank you for your feedback.';
        this.reviewForm.reset({ rating: 5 });
        this.showReviewForm = false;
        this.isSubmittingReview = false;
        this.scrollToTop();
      }, 1000);
    } else {
      this.markFormGroupTouched();
    }
  }

  // Utility methods
  markFormGroupTouched(): void {
    Object.keys(this.reviewForm.controls).forEach(key => {
      const control = this.reviewForm.get(key);
      control?.markAsTouched();
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Star rating methods
  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, index) => index < rating);
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/books']);
  }

  editBook(): void {
    if (this.book?._id) {
      this.router.navigate(['/edit-book', this.book._id]);
    }
  }

  deleteBook(): void {
    if (!this.book?._id) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${this.book.title}"? This action cannot be undone.`);
    if (confirmDelete) {
      this.bookService.deleteBook(this.book._id).subscribe({
        next: () => {
          this.bookService.setFeedbackMessage(`✅ Book "${this.book!.title}" deleted successfully!`);
          this.router.navigate(['/books']);
        },
        error: (error) => {
          console.error('Error deleting book:', error);
          this.errorMessage = `❌ Failed to delete book: ${error.message}`;
        }
      });
    }
  }

  // Helper methods for template
  getAverageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  getRatingDistribution(): { rating: number, count: number, percentage: number }[] {
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const count = this.reviews.filter(review => review.rating === rating).length;
      const percentage = this.reviews.length > 0 ? (count / this.reviews.length) * 100 : 0;
      return { rating, count, percentage };
    });
    return distribution;
  }
}
