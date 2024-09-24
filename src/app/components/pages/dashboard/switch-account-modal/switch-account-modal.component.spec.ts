import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchAccountModalComponent } from './switch-account-modal.component';

describe('SwitchAccountModalComponent', () => {
  let component: SwitchAccountModalComponent;
  let fixture: ComponentFixture<SwitchAccountModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchAccountModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwitchAccountModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
