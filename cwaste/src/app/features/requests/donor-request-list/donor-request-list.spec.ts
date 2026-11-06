import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorRequestListComponent } from './donor-request-list';

describe('DonorRequestList', () => {
  let component: DonorRequestListComponent;
  let fixture: ComponentFixture<DonorRequestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorRequestListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonorRequestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
