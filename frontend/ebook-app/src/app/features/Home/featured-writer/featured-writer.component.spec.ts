import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturedWriterComponent } from './featured-writer.component';

describe('FeaturedWriterComponent', () => {
  let component: FeaturedWriterComponent;
  let fixture: ComponentFixture<FeaturedWriterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedWriterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeaturedWriterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
