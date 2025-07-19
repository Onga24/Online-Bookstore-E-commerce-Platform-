import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookListComponent } from './book-list.component';
import { BookService } from '../../../core/services/book.service'; // Import BookService
import { of } from 'rxjs'; // Import 'of' for creating observable mocks
describe('BookListComponent', () => {
  let component: BookListComponent;
  let fixture: ComponentFixture<BookListComponent>;
  let mockBookService: any; // Use 'any' for simplicity in a quick mock, or create a strict mock

  beforeEach(async () => {

      mockBookService = {
      getBooks: jasmine.createSpy('getBooks').and.returnValue(of([])), // Returns an empty array observable by default
      successMessage$: of(''), // Mock the BehaviorSubject
      setFeedbackMessage: jasmine.createSpy('setFeedbackMessage'),
    };
    await TestBed.configureTestingModule({
      imports: [BookListComponent],
       providers: [
        // Provide the mock BookService instead of the real one
        { provide: BookService, useValue: mockBookService }]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
});
