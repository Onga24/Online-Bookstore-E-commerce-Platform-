// src/app/core/services/book.service.ts

// --- Core Angular Imports ---
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse for better error handling
// --- RxJS Imports ---
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators'; // Import 'tap' for side effects like logging/refreshing

// --- Data Interface (shared between frontend and backend concepts) ---
// This interface defines the expected shape of book data, useful for forms
// and for the data received from the backend (with URLs for files).
export interface BookData {
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  publisher: string;
  publicationDate: string;
  imageBase64?: string | null; // For manual image upload (base64 string for initial transmission or null to clear)
  pdf?: File | null; // For final PDF file upload (File object for transmission or null to clear)
  _id?: string; // Optional: for existing books (ID from MongoDB)
  pdfUrl?: string; // URL to the stored PDF on the backend (after submission)
  coverImage?: string; // URL to the stored cover image on the backend (after submission)
  createdAt?: string; // Optional: timestamp for creation
  updatedAt?: string; // Optional: timestamp for last update
}

@Injectable({
  providedIn: 'root', // This makes the service a singleton and available throughout the app
})
export class BookService {
  // Your backend API base URL. Ensure this matches your Node.js server's port.
  // Based on your `.env` for backend, the port is 3000 now.
  private apiUrl = 'http://localhost:3000/api/books'; // CONFIRMED: Backend runs on 3000 as per previous context.

  private _successMessage = new BehaviorSubject<string>(''); // Private Subject for internal state management
  // Public Observable exposed for components to subscribe to feedback messages
  readonly successMessage$: Observable<string> =
    this._successMessage.asObservable();

  // HttpClient is injected into the constructor, making it available as 'this.http'
  constructor(private http: HttpClient) {}

  /**
   * Helper for consistent error handling.
   * @param error The HttpErrorResponse object.
   * @param operation A string describing the operation that failed.
   */
  private handleError(error: HttpErrorResponse, operation: string) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client-side error in ${operation}: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, ` +
          `body was: ${JSON.stringify(error.error)}`
      );
      if (error.error && error.error.message) {
        errorMessage = `Backend error in ${operation}: ${error.error.message}`;
      } else {
        errorMessage = `Server error in ${operation}: ${
          error.statusText || 'Unknown error'
        }`;
      }
    }
    this.setFeedbackMessage('❌ ' + errorMessage);
    return throwError(() => new Error(errorMessage)); // Re-throw for component to catch if needed
  }

  /**
   * Converts a File object (e.g., image) to a Base64 encoded string.
   * Useful for previewing images or sending small images directly in JSON/FormData.
   * @param file The File object to convert.
   * @returns An Observable that emits the Base64 string.
   */
  convertToBase64(file: File): Observable<string> {
    return new Observable((observer) => {
      if (!file) {
        observer.next(''); // Emit empty string if no file
        observer.complete(); // Complete the observable
        return;
      }

      const reader = new FileReader(); // Create a FileReader instance
      reader.onload = () => {
        // When file is loaded
        observer.next(reader.result as string); // Emit the result (Base64 string)
        observer.complete(); // Complete the observable
      };
      reader.onerror = (error) => {
        // On error
        observer.error(error); // Emit the error
      };
      reader.readAsDataURL(file); // Read the file as a Data URL (Base64)
    });
  }

  /**
   * Submits complete book data (including imageBase64 and PDF file if provided)
   * to the backend API for creation/final storage.
   * @param bookData An object containing all the book details.
   * @returns An Observable representing the HTTP response from the backend.
   */
  submitBook(bookData: BookData): Observable<BookData> {
    const formData = new FormData();

    // --- Append all required text fields ---
    formData.append('title', bookData.title);
    formData.append('author', bookData.author);
    formData.append('description', bookData.description);
    formData.append('price', bookData.price.toString());
    formData.append('category', bookData.category);
    formData.append('publisher', bookData.publisher || '');
    formData.append('publicationDate', bookData.publicationDate || '');

    // --- Append imageBase64 if present ---
    // Send empty string if null/undefined to allow backend to handle clearing or skipping
    if (bookData.imageBase64 !== undefined) {
      formData.append('imageBase64', bookData.imageBase64 || '');
    }

    // --- Append PDF File if present ---
    if (bookData.pdf instanceof File) {
      formData.append('pdf', bookData.pdf, bookData.pdf.name);
    }

    // --- Make the POST request ---
    return this.http.post<BookData>(`${this.apiUrl}/add`, formData).pipe(
      tap((response) => {
        console.log('✅ Book submitted successfully:', response);
        this.setFeedbackMessage('✅ Book added successfully!');
      }),
      catchError((error) => this.handleError(error, 'submitBook'))
    );
  }

  /**
   * Sends a PDF file to the backend for processing and extraction of book data (autofill).
   * The backend will use pdf-parse and Cohere-AI for this.
   * @param pdfFile The PDF File object to send for processing.
   * @returns An Observable that emits a partial BookData object (title, author, description, category).
   */
  processPdfForAutofill(pdfFile: File): Observable<Partial<BookData>> {
    const formData = new FormData();
    formData.append('pdf', pdfFile, pdfFile.name); // 'pdf' should match multer's field name on backend

    // Make the POST request to the backend's /process-pdf endpoint
    return this.http
      .post<Partial<BookData>>(this.apiUrl + '/process-pdf', formData)
      .pipe(
        tap((data) =>
          console.log('BookService: PDF processed for autofill', data)
        ),
        catchError((error) => this.handleError(error, 'processPdfForAutofill'))
      );
  }

  /**
   * Fetches a list of all books from the backend.
   * @returns An Observable that emits an array of BookData.
   */
  getBooks(): Observable<BookData[]> {
    // Changed to return BookData[]
    return this.http.get<BookData[]>(this.apiUrl).pipe(
      tap((books) =>
        console.log('BookService: Fetched all books', books.length)
      ),
      catchError((error) => this.handleError(error, 'getBooks'))
    );
  }

  /**
   * Sets a feedback message that components can subscribe to and displays it temporarily.
   * @param message The message to display.
   */
  setFeedbackMessage(message: string) {
    this._successMessage.next(message); // Emit the message
    setTimeout(() => {
      this._successMessage.next(''); // Clear the message after 3 seconds
    }, 3000);
  }

  /**
   * Scrolls the window to the top smoothly.
   */
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Fetches a single book by its ID from the backend.
   * @param id The ID of the book to retrieve.
   * @returns An Observable that emits the BookData object.
   */
  getBookById(id: string): Observable<BookData> {
    // Changed to return BookData
    return this.http.get<BookData>(`${this.apiUrl}/${id}`).pipe(
      tap((book) => console.log(`BookService: Fetched book by ID: ${id}`)),
      catchError((error) => this.handleError(error, 'getBookById'))
    );
  }

  /**
   * Updates an existing book by its ID.
   * @param id The ID of the book to update.
   * @param bookData The updated book data.
   * @returns An Observable representing the HTTP response from the backend.
   */
  updateBook(id: string, bookData: BookData): Observable<BookData> {
    // Changed to return BookData
    const formData = new FormData();

    // Append all required text fields (even if unchanged, send current values)
    formData.append('title', bookData.title);
    formData.append('author', bookData.author);
    formData.append('description', bookData.description);
    formData.append('price', bookData.price.toString());
    formData.append('category', bookData.category);

    // Append optional text fields, ensuring they are always sent as strings (empty if null/undefined)
    formData.append('publisher', bookData.publisher || '');
    formData.append('publicationDate', bookData.publicationDate || '');

    // Handle imageBase64:
    // If a new file is selected, it will be in bookData.imageBase64 (string).
    // If the user wants to clear the image, bookData.imageBase64 should be explicitly null.
    // If bookData.imageBase64 is undefined, it means the image wasn't touched, so we don't append it to preserve existing.
    if (bookData.imageBase64 !== undefined) {
      // Check if the property was explicitly set (even to null/empty string)
      formData.append('imageBase64', bookData.imageBase64 || ''); // Send empty string for null
    }

    // Handle PDF file:
    // If a new PDF is selected, it will be in bookData.pdf (a File object).
    // If the user wants to clear the PDF, bookData.pdf should be explicitly null.
    // If bookData.pdf is undefined, it means the PDF wasn't touched, so we don't append it to preserve existing.
    if (bookData.pdf !== undefined) {
      // Check if the property was explicitly set (even to null)
      if (bookData.pdf instanceof File) {
        formData.append('pdf', bookData.pdf, bookData.pdf.name);
      } else if (bookData.pdf === null) {
        formData.append('pdf', ''); // Send empty string if PDF is explicitly cleared
      }
    }

    // Make the PUT request to the backend's /:id endpoint
    return this.http.put<BookData>(`${this.apiUrl}/${id}`, formData).pipe(
      // Expect BookData back
      tap((response) => {
        console.log('Book updated successfully on backend:', response);
        this.setFeedbackMessage('✅ Book updated successfully!');
      }),
      catchError((error) => this.handleError(error, 'updateBook'))
    );
  }

  /**
   * Deletes a book by its ID from the backend.
   * @param id The ID of the book to delete.
   * @returns An Observable representing the HTTP response from the backend.
   */
  deleteBook(id: string): Observable<any> {
    // Using 'any' as return type, or 'void' if no body expected
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log(`BookService: Book with ID ${id} deleted.`);
        this.setFeedbackMessage('✅ Book deleted successfully!');
      }),
      catchError((error) => this.handleError(error, 'deleteBook'))
    );
  }
}
