// src/app/core/services/book.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface BookData {
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  publisher: string;
  publicationDate: string;
  imageBase64?: string; // This is for manual image upload
  pdf?: File; // This is for final PDF upload
  _id?: string;
  pdfUrl?: string; // From backend (final stored PDF URL)
  coverImage?: string; // From backend (final stored cover image URL)
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private _successMessage = new BehaviorSubject<string>('');
  readonly successMessage$: Observable<string> = this._successMessage.asObservable();

  private apiUrl = 'http://localhost:3000/api/books';

  constructor(private http: HttpClient) { }

  convertToBase64(file: File): Observable<string> {
    // ... (keep as is)
    return new Observable(observer => {
      if (!file) {
        observer.next('');
        observer.complete();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        observer.next(reader.result as string);
        observer.complete();
      };
      reader.onerror = error => {
        observer.error(error);
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Submits book data (including files) to the backend API for FINAL storage.
   * @param bookData An object containing all the book details.
   * @returns An Observable representing the HTTP response from the backend.
   */
  submitBook(bookData: BookData): Observable<any> {
    const formData = new FormData();

    formData.append('title', bookData.title);
    formData.append('author', bookData.author);
    formData.append('description', bookData.description);
    formData.append('price', bookData.price.toString());
    formData.append('category', bookData.category);
    formData.append('publisher', bookData.publisher);
    formData.append('publicationDate', bookData.publicationDate);

    // Only append imageBase64 if it's explicitly set by user (not from PDF auto-fill)
    if (bookData.imageBase64) {
      formData.append('imageBase64', bookData.imageBase64);
    }

    // Append PDF file for FINAL storage if available
    if (bookData.pdf) {
      formData.append('pdf', bookData.pdf, bookData.pdf.name);
    }

    return this.http.post(this.apiUrl + '/add', formData).pipe(
      catchError(error => {
        this.setFeedbackMessage('❌ Error submitting book: ' + (error.error?.message || error.message));
        return throwError(() => error);
      })
    );
  }

  /**
   * Sends a PDF file to the backend for processing and extraction of book data.
   * @param pdfFile The PDF File object to send.
   * @returns An Observable that emits the extracted BookData.
   */
  processPdfForAutofill(pdfFile: File): Observable<Partial<BookData>> {
    const formData = new FormData();
    formData.append('pdf', pdfFile, pdfFile.name); // 'pdf' should match multer's field name

    return this.http.post<Partial<BookData>>(this.apiUrl + '/process-pdf', formData).pipe(
      catchError(error => {
        this.setFeedbackMessage('❌ Error processing PDF: ' + (error.error?.message || error.message));
        return throwError(() => error);
      })
    );
  }


  getBooks(): Observable<BookData[]> {
    // ... (keep as is)
    return this.http.get<BookData[]>(this.apiUrl).pipe(
      catchError(error => {
        this.setFeedbackMessage('❌ Error fetching books: ' + (error.error?.message || error.message));
        return throwError(() => error);
      })
    );
  }

  setFeedbackMessage(message: string) {
    // ... (keep as is)
    this._successMessage.next(message);
    setTimeout(() => {
      this._successMessage.next('');
    }, 3000);
  }

  scrollToTop() {
    // ... (keep as is)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
