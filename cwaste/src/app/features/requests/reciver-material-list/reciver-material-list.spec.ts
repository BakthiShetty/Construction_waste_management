import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiverMaterialListComponent } from './reciver-material-list';

describe('ReciverMaterialList', () => {
  let component: ReceiverMaterialListComponent;
  let fixture: ComponentFixture<ReceiverMaterialListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiverMaterialListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiverMaterialListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
