// src/app/book-form/book-form.component.ts
// --- Core Angular Imports ---
import {
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common'; // For ngIf, ngFor, etc.
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms'; // For reactive forms and validators
import { Router } from '@angular/router'; // For navigation after submission

// --- RxJS Imports ---
import { Subscription } from 'rxjs'; // For managing subscriptions to Observables

// --- Service Import ---
// Adjust path if needed based on your project structure
import { BookService, BookData } from '../../../core/services/book.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.css', // Note: styleUrl for standalone component, styleUrls for array
})
export class BookFormComponent implements OnInit, OnDestroy {
  // Reactive Form Group for the book data
  Bookform!: FormGroup;

  // Properties to hold file data and previews
  imgSrc: string = ''; // Stores Base64 string for image preview and submission
  pdfFile: File | null = null; // Stores the File object for the main PDF upload (now consolidated)

  // UI state and feedback
  successMessage: string = '';
  showScrollTop = false;
  imageTouched: boolean = false; // Tracks if the image input has been interacted with (for validation display)
  isLoading: boolean = false; // Controls the loading overlay and form disable/visibility state

  // ViewChild references to access native HTML input elements (e.g., to clear their value)
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  // Renamed ViewChild to match the single PDF input
  @ViewChild('pdfUploadInput') pdfUploadInput!: ElementRef<HTMLInputElement>;

  // Subscription to manage cleanup for feedback messages
  private feedbackMessageSubscription!: Subscription;

  // HostListener to detect window scroll for the "scroll to top" button visibility
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop = window.scrollY > 200;
  }

  // Constructor: Injects FormBuilder, BookService, and Router
  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private router: Router // Injected for navigation
  ) {}

  ngOnInit() {
    // Initialize the Reactive Form with validators
    this.Bookform = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      description: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]], // Price should be a number, converted to string for FormData in service
      category: ['', Validators.required],
      publisher: ['', Validators.required],
      publicationDate: ['', Validators.required],
    });

    // Subscribe to feedback messages from the BookService
    this.feedbackMessageSubscription =
      this.bookService.successMessage$.subscribe((message) => {
        this.successMessage = message;
      });
  }

  ngOnDestroy() {
    // Unsubscribe from observables to prevent memory leaks
    if (this.feedbackMessageSubscription) {
      this.feedbackMessageSubscription.unsubscribe();
    }
  }

  // Helper method to scroll to the top of the page
  scrollToTop() {
    this.bookService.scrollToTop();
  }

  onImageChange(event: Event) {
    this.imageTouched = true;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.bookService.convertToBase64(file).subscribe({
        next: (base64String) => {
          this.imgSrc = base64String;
        },
        error: (err) => {
          console.error('Error converting image to base64:', err);
          this.imgSrc = '';
          this.bookService.setFeedbackMessage('❌ Error processing image.');
        },
      });
    } else {
      this.imgSrc = '';
    }
  }

  // --- Consolidated PDF Upload and Autofill Handler ---
  onPdfUploadChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'application/pdf') {
      this.pdfFile = file; // <--- Store the selected PDF file here for both autofill and final submission
      console.log('PDF file selected:', this.pdfFile.name);
      this.processPdfForFormFill(); // Immediately attempt to autofill
    } else {
      alert('Please select a PDF file.');
      this.pdfFile = null; // Clear the stored file if not a PDF or selection is cancelled
      if (this.pdfUploadInput) {
        this.pdfUploadInput.nativeElement.value = ''; // Clear the native input
      }
      this.bookService.setFeedbackMessage(
        '❌ Please select a valid PDF file for upload.'
      );
    }
  }

  /**
   * Clears the selected PDF file.
   */
  clearPdfFile(): void {
    this.pdfFile = null;
    if (this.pdfUploadInput) {
      this.pdfUploadInput.nativeElement.value = ''; // Clear the native file input
    }
    this.bookService.setFeedbackMessage('PDF file cleared.');
  }


  /**
   * Sends the selected PDF for autofill to the backend and patches form values.
   */
  processPdfForFormFill() {
    if (!this.pdfFile) { // Use this.pdfFile directly
      this.bookService.setFeedbackMessage('No PDF file selected for autofill.');
      return;
    }

    this.isLoading = true;
    this.bookService.setFeedbackMessage('⏳ Processing PDF for autofill, please wait...');

    this.bookService.processPdfForAutofill(this.pdfFile).subscribe({ // Use this.pdfFile
      next: (extractedData: Partial<BookData>) => {
        this.Bookform.patchValue({
          title: extractedData.title !== 'Not Found' ? extractedData.title : '',
          author: extractedData.author !== 'Not Found' ? extractedData.author : '',
          description: extractedData.description !== 'Not Found' ? extractedData.description : '',
          category: extractedData.category !== 'Not Found' ? extractedData.category : '',
          publisher: extractedData.publisher !== 'Not Found' ? extractedData.publisher : '',
          publicationDate: extractedData.publicationDate !== 'Not Found' ? extractedData.publicationDate : '',
          price: typeof extractedData.price === 'number' ? extractedData.price : null,
        });
        if (extractedData.imageBase64) {
          this.imgSrc = extractedData.imageBase64;
          this.imageTouched = true;
        }

        this.isLoading = false;
        this.bookService.setFeedbackMessage(
          '✅ PDF processed successfully! Form pre-filled. Please add a cover image if not provided.'
        );
        this.bookService.scrollToTop();
      },
      error: (err) => {
        console.error('Error processing PDF for autofill:', err);
        this.imgSrc = '';
        // Do NOT clear this.pdfFile here, as it's still needed for final submission.
        // The user might want to submit the PDF even if autofill failed.
        if (this.pdfUploadInput) {
          this.pdfUploadInput.nativeElement.value = ''; // Clear native input visual
        }
        this.imageTouched = false;
        this.isLoading = false;
        this.bookService.setFeedbackMessage(
          '❌ Failed to process PDF for autofill. Please enter details manually.'
        );
        this.bookService.scrollToTop();
      },
    });
  }

  /**
   * Handles the form submission. Gathers data into a BookData object and sends it to the service.
   */
  onSubmit() {
    this.Bookform.markAllAsTouched();
    this.bookService.scrollToTop();
    this.imageTouched = true;

    if (this.Bookform.invalid) {
      this.bookService.setFeedbackMessage('❌ Please fill in all required fields correctly.');
      this.isLoading = false;
      return;
    }

    if (!this.imgSrc) {
      this.bookService.setFeedbackMessage('❌ Cover image is required.');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.bookService.setFeedbackMessage('⏳ Adding book...');

    const bookData: BookData = {
      title: this.Bookform.get('title')?.value,
      author: this.Bookform.get('author')?.value,
      description: this.Bookform.get('description')?.value,
      price: this.Bookform.get('price')?.value,
      category: this.Bookform.get('category')?.value,
      publisher: this.Bookform.get('publisher')?.value || '',
      publicationDate: this.Bookform.get('publicationDate')?.value || '',
      imageBase64: this.imgSrc,
      pdf: this.pdfFile, // <--- This now consistently holds the selected PDF File object
    };

    console.log('Frontend onSubmit: bookData.pdf value:', bookData.pdf);
    console.log('Frontend onSubmit: Is bookData.pdf an instance of File?', bookData.pdf instanceof File);

    this.bookService.submitBook(bookData).subscribe({
      next: (response) => {
        console.log('Book submitted successfully!', response);
        this.bookService.scrollToTop();
        this.bookService.setFeedbackMessage('✅ Book submitted successfully!');
        this.isLoading = false;

        this.Bookform.reset();
        this.imgSrc = '';
        this.pdfFile = null; // Clear the selected PDF file
        this.imageTouched = false;
        if (this.imageInput) this.imageInput.nativeElement.value = '';
        if (this.pdfUploadInput) this.pdfUploadInput.nativeElement.value = ''; // Clear the native input
      },
      error: (error) => {
        console.error('Error submitting book:', error);
        this.isLoading = false;
        this.bookService.scrollToTop();
      },
    });
  }
}