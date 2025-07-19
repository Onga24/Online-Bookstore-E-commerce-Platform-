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
  pdfFile: File | null = null; // Stores the File object for the main PDF upload
  pdfFileForAutofill: File | null = null; // Stores the File object for PDF autofill

  // UI state and feedback
  successMessage: string = '';
  showScrollTop = false;
  imageTouched: boolean = false; // Tracks if the image input has been interacted with (for validation display)

  // ViewChild references to access native HTML input elements (e.g., to clear their value)
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pdfInput') pdfInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pdfAutofillInput')
  pdfAutofillInput!: ElementRef<HTMLInputElement>;

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
      price: ['', [Validators.required, Validators.min(0)]], // Price should be a number, converted to string for FormData in service
      category: ['', Validators.required],
      publisher: ['', Validators.required],
      publicationDate: ['', Validators.required],
      // File inputs (image, pdf) are handled separately via component properties (imgSrc, pdfFile)
      // and are not directly part of the FormGroup's FormControls.
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

  /**
   * Handles the change event for the cover image input.
   * Converts the selected image file to a Base64 string for preview and submission.
   * @param event The DOM change event.
   */
  onImageChange(event: Event) {
    this.imageTouched = true; // Mark image input as touched for validation display
    const file = (event.target as HTMLInputElement).files?.[0]; // Get the selected file

    if (file) {
      this.bookService.convertToBase64(file).subscribe({
        next: (base64String) => {
          this.imgSrc = base64String; // Store the Base64 string for preview and later submission
        },
        error: (err) => {
          console.error('Error converting image to base64:', err);
          this.imgSrc = ''; // Clear image source on error
          this.bookService.setFeedbackMessage('❌ Error processing image.');
        },
      });
    } else {
      this.imgSrc = ''; // Clear image source if file selection is cancelled or input is cleared
    }
  }

  /**
   * Handles the change event for the main PDF file input.
   * Stores the selected PDF File object for submission.
   * @param event The DOM change event.
   */
  // onPDFChange(event: Event) {
  //   const file = (event.target as HTMLInputElement).files?.[0]; // Get the selected file

  //   if (file && file.type === 'application/pdf') {
  //     this.pdfFile = file; // Store the File object
  //     console.log('PDF file selected for final submission:', this.pdfFile.name);
  //   } else {
  //     alert("Only PDF files are allowed for final submission.");
  //     this.pdfFile = null; // Clear the stored file
  //     // Optionally clear the native file input element
  //     if (this.pdfInput) {
  //       this.pdfInput.nativeElement.value = '';
  //     }
  //     this.bookService.setFeedbackMessage('❌ Only PDF files are allowed for final upload.');
  //   }
  // }
  onPDFChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (file && file.type === 'application/pdf') {
      this.pdfFile = file; // <-- this correctly assigns the File object
      console.log('PDF file selected for final submission:', this.pdfFile.name);
    } else {
      alert('Only PDF files are allowed for final submission.');
      this.pdfFile = null; // <-- this clears it if not a PDF or selection is cancelled
      if (this.pdfInput) {
        this.pdfInput.nativeElement.value = '';
      }
      this.bookService.setFeedbackMessage(
        '❌ Only PDF files are allowed for final upload.'
      );
    }
  }
  /**
   * Handles the change event for the PDF autofill input.
   * Stores the selected PDF File object and triggers the autofill process.
   * @param event The DOM change event.
   */
  onPDFAutofillChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]; // Get the selected file

    if (file && file.type === 'application/pdf') {
      this.pdfFileForAutofill = file; // Store the File object for autofill
      this.processPdfForFormFill(); // Call the autofill processing method
    } else {
      alert('Please select a PDF file to auto-fill the form.');
      this.pdfFileForAutofill = null; // Clear the stored file
      // Optionally clear the native file input element
      if (this.pdfAutofillInput) {
        this.pdfAutofillInput.nativeElement.value = '';
      }
      this.bookService.setFeedbackMessage(
        '❌ Please select a valid PDF to auto-fill.'
      );
    }
  }

  /**
   * Sends the selected PDF for autofill to the backend and patches form values.
   */
  processPdfForFormFill() {
    if (!this.pdfFileForAutofill) {
      this.bookService.setFeedbackMessage('Please select a PDF file first.');
      return;
    }

    this.bookService.setFeedbackMessage('⏳ Processing PDF, please wait...');
    this.bookService.processPdfForAutofill(this.pdfFileForAutofill).subscribe({
      next: (extractedData) => {
        // Patch the form values with data extracted from the PDF
        this.Bookform.patchValue({
          title: extractedData.title || '',
          author: extractedData.author || '',
          description: extractedData.description || '',
          category: extractedData.category || '',
          // Preserve existing price, publisher, publicationDate if not extracted
          price: this.Bookform.get('price')?.value || 0,
          publisher: this.Bookform.get('publisher')?.value || '',
          publicationDate: this.Bookform.get('publicationDate')?.value || '',
        });
        // If autofill provides an image (Base64), set it and mark as touched
        if (extractedData.imageBase64) {
          this.imgSrc = extractedData.imageBase64;
          this.imageTouched = true;
        }
        this.bookService.setFeedbackMessage(
          '✅ PDF processed successfully! Form pre-filled. Please add a cover image if not provided.'
        );
        this.bookService.scrollToTop();
      },
      error: (err) => {
        console.error('Error processing PDF for autofill:', err);
        this.Bookform.reset(); // Reset form on error
        this.imgSrc = '';
        this.pdfFileForAutofill = null;
        if (this.pdfAutofillInput) {
          this.pdfAutofillInput.nativeElement.value = '';
        }
        this.imageTouched = false; // Reset touched state on error
        // Error message is already set by service's handleError
      },
    });
  }

  /**
   * Handles the form submission. Gathers data into a BookData object and sends it to the service.
   */
  onSubmit() {
    // Mark all form controls as touched to display validation errors
    this.Bookform.markAllAsTouched();
    this.imageTouched = true; // Mark image input as touched for validation

    // Basic form validation check
    if (this.Bookform.invalid) {
      this.bookService.setFeedbackMessage(
        '❌ Please fill in all required fields correctly.'
      );
      this.bookService.scrollToTop();
      return;
    }

    // Custom validation for cover image (if required by your business logic)
    if (!this.imgSrc) {
      // If imgSrc is empty, it means no image was provided or processed
      this.bookService.setFeedbackMessage('❌ Cover image is required.');
      this.bookService.scrollToTop();
      return;
    }

    // --- IMPORTANT: Construct a BookData object (plain JavaScript object) ---
    // The BookService's submitBook method now expects this BookData object.
    // The service itself will convert this into FormData for the HTTP request.
    const bookData: BookData = {
      title: this.Bookform.get('title')?.value,
      author: this.Bookform.get('author')?.value,
      description: this.Bookform.get('description')?.value,
      price: this.Bookform.get('price')?.value, // Send as number, service will convert to string for FormData
      category: this.Bookform.get('category')?.value,
      publisher: this.Bookform.get('publisher')?.value || '', // Ensure optional fields are strings
      publicationDate: this.Bookform.get('publicationDate')?.value || '', // Ensure optional fields are strings
      imageBase64: this.imgSrc, // Pass the Base64 string
      pdf: this.pdfFile, // Pass the File object (or null if not selected)
    };

    console.log('Frontend onSubmit: bookData.pdf value:', bookData.pdf);
    console.log(
      'Frontend onSubmit: Is bookData.pdf an instance of File?',
      bookData.pdf instanceof File
    );
    // --- END ADDED CONSOLE LOGS ---
    // --- Send the BookData object to the service ---
    // The service handles the FormData creation and HTTP request details.
    this.bookService.submitBook(bookData).subscribe({
      next: (response) => {
        console.log('Book submitted successfully!', response);
        this.bookService.setFeedbackMessage('✅ Book submitted successfully!');
        this.bookService.scrollToTop();

        // Reset the form and component state after successful submission
        this.Bookform.reset();
        this.imgSrc = '';
        this.pdfFile = null;
        this.pdfFileForAutofill = null;
        this.imageTouched = false; // Reset touched state
        // Clear native file input elements
        if (this.imageInput) this.imageInput.nativeElement.value = '';
        if (this.pdfInput) this.pdfInput.nativeElement.value = '';
        if (this.pdfAutofillInput)
          this.pdfAutofillInput.nativeElement.value = '';
        this.bookService.scrollToTop();
      },
      error: (error) => {
        // Error message is already handled and set by the service's handleError method
        console.error('Error submitting book:', error);
      },
    });
  }
}
