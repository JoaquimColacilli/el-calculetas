import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private apiUrl = 'https://dolarapi.com/v1/dolares';

  constructor(private http: HttpClient) {}

  getDollarRates(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }
}
