// src/app/features/books/edit-book/edit-book.component.ts

import { Component, ElementRef, ViewChild, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription } from 'rxjs';

import { BookService, BookData } from '../../../core/services/book.service'; // <--- Corrected path based on new structure

@Component({
  selector: 'app-edit-book',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './edit-book.component.html',
  styleUrl: './edit-book.component.css'
})
export class EditBookComponent implements OnInit, OnDestroy {
  editBookForm!: FormGroup;
  bookId!: string;
  isLoading: boolean = true;
  imgSrc: string | null = null;
  pdfFile: File | null = null;
  currentPdfUrl: string | null = null;
  currentCoverImageUrl: string | null = null;

  successMessage: string = '';
  showScrollTop = false;

  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
  @ViewChild('pdfInput') pdfInput!: ElementRef<HTMLInputElement>;

  private feedbackMessageSubscription!: Subscription;
  private routeSubscription!: Subscription;
  private bookSubscription!: Subscription;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop = window.scrollY > 200;
  }

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.editBookForm = this.fb.group({
      title: ['', Validators.required],
      author: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      publisher: [''],
      publicationDate: [''],
    });

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bookId = id;
        this.fetchBookDetails(id);
      } else {
        this.bookService.setFeedbackMessage('❌ No book ID provided for editing.');
        this.router.navigate(['/books']);
      }
    });

    this.feedbackMessageSubscription = this.bookService.successMessage$.subscribe(
      message => {
        this.successMessage = message;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.feedbackMessageSubscription) {
      this.feedbackMessageSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.bookSubscription) {
      this.bookSubscription.unsubscribe();
    }
  }

  fetchBookDetails(id: string): void {
    this.isLoading = true;
    this.bookSubscription = this.bookService.getBookById(id).subscribe({
      next: (book: BookData) => {
        // Correct format for publicationDate for input type="date"
        const formattedDate = book.publicationDate ? new Date(book.publicationDate).toISOString().split('T')[0] : '';

        this.editBookForm.patchValue({
          title: book.title,
          author: book.author,
          description: book.description,
          price: book.price,
          category: book.category,
          publisher: book.publisher || '',
          publicationDate: formattedDate, // Use formatted date
        });

        this.currentPdfUrl = book.pdfUrl || null;
        this.currentCoverImageUrl = book.coverImage || null;
        this.imgSrc = book.coverImage || null;

        this.isLoading = false;
        this.bookService.setFeedbackMessage(`✅ Book "${book.title}" loaded for editing.`);
      },
      error: (error) => {
        console.error('Error fetching book for edit:', error);
        this.isLoading = false;
        this.bookService.setFeedbackMessage('❌ Failed to load book for editing.');
        this.router.navigate(['/books']);
      }
    });
  }

  onImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.bookService.convertToBase64(file).subscribe({
        next: (base64String) => {
          this.imgSrc = base64String;
          this.currentCoverImageUrl = null;
        },
        error: (err) => {
          console.error("Error converting image to base64:", err);
          this.imgSrc = null;
          this.bookService.setFeedbackMessage('❌ Error processing new image.');
        }
      });
    } else {
      // If user clears the input via dialog, this means they don't want a new image.
      // Do nothing specific here regarding `currentCoverImageUrl`, `imgSrc` already reflects selection.
    }
  }

  onPDFChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'application/pdf') {
      this.pdfFile = file;
      this.currentPdfUrl = null;
    } else {
      alert("Only PDF files are allowed for final submission.");
      this.pdfFile = null;
      if (this.pdfInput) {
        this.pdfInput.nativeElement.value = '';
      }
      this.bookService.setFeedbackMessage('❌ Only PDF files are allowed for upload.');
    }
  }

  clearImage() {
    this.imgSrc = null;
    this.currentCoverImageUrl = null;
    if (this.imageInput) {
      this.imageInput.nativeElement.value = '';
    }
    this.bookService.setFeedbackMessage('Cover image cleared.');
  }

  clearPdf() {
    this.pdfFile = null;
    this.currentPdfUrl = null;
    if (this.pdfInput) {
      this.pdfInput.nativeElement.value = '';
    }
    this.bookService.setFeedbackMessage('PDF file cleared.');
  }

  onSubmit(): void {
    this.editBookForm.markAllAsTouched();

    if (this.editBookForm.invalid) {
      this.bookService.setFeedbackMessage('❌ Please fill in all required fields correctly.');
      this.bookService.scrollToTop();
      return;
    }

    const bookData: BookData = {
      ...this.editBookForm.value,
      imageBase64: undefined,
      pdf: undefined
    };

    // Handle imageBase64 logic for update
    if (this.imgSrc && !this.imgSrc.startsWith('http')) {
      // New image selected (imgSrc holds base64)
      bookData.imageBase64 = this.imgSrc;
    } else if (this.currentCoverImageUrl === null) {
      // User explicitly cleared the existing image
      bookData.imageBase64 = ''; // Send empty string to backend to remove
    }
    // Else (imgSrc is current URL or was empty and no new selected): imageBase64 remains undefined, backend preserves it.


    // Handle PDF logic for update
    if (this.pdfFile) {
      // New PDF selected (pdfFile holds File object)
      bookData.pdf = this.pdfFile;
    } else if (this.currentPdfUrl === null) {
      // User explicitly cleared the existing PDF
      bookData.pdf = null; // Send null to backend to remove
    }
    // Else (pdfFile is null and currentPdfUrl is not null, and user didn't clear): pdf remains undefined, backend preserves it.


    this.isLoading = true;
    this.bookService.updateBook(this.bookId, bookData).subscribe({
      next: (response) => {
        console.log('Book updated successfully!', response);
        this.bookService.setFeedbackMessage('✅ Book updated successfully!');
        this.isLoading = false;
        this.bookService.scrollToTop();
        this.router.navigate(['/books']);
      },
      error: (error) => {
        console.error('Error updating book:', error);
        this.bookService.setFeedbackMessage('❌ Error updating book. Please try again.');
        this.isLoading = false;
        this.bookService.scrollToTop();
      }
    });
  }

  scrollToTop() {
    this.bookService.scrollToTop();
  }

  goBack(): void {
    this.router.navigate(['/books']);
  }
}