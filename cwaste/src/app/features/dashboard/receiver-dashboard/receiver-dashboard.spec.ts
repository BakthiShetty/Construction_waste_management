import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiverDashboardComponent } from './receiver-dashboard';

describe('ReceiverDashboard', () => {
  let component: ReceiverDashboardComponent;
  let fixture: ComponentFixture<ReceiverDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiverDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiverDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
