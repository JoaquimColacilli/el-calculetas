import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PantallaEnConstruccionComponent } from './pantalla-en-construccion.component';

describe('PantallaEnConstruccionComponent', () => {
  let component: PantallaEnConstruccionComponent;
  let fixture: ComponentFixture<PantallaEnConstruccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PantallaEnConstruccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PantallaEnConstruccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
