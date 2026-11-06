import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestFormComponent } from './request-form';

describe('RequestForm', () => {
  let component: RequestFormComponent;
  let fixture: ComponentFixture<RequestFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
