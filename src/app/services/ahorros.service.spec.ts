import { TestBed } from '@angular/core/testing';

import { AhorrosService } from './ahorros.service';

describe('AhorrosService', () => {
  let service: AhorrosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AhorrosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
