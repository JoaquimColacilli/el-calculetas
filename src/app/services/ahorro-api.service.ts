import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AhorroApiService {
  private apiUrl = 'https://api.api-ninjas.com/v1/quotes';
  private apiKey = 'OYPlnHUL6ggS61tSpxEnkg==tAAEu3TDvTsliunH';

  private deeplApiUrl = 'https://api-free.deepl.com/v2/translate';
  private deeplApiKey = '6dd0ae7e-57a9-4c73-9e57-533caf04ebd8:fx';

  constructor(private http: HttpClient) {}

  getQuote(category: string = 'businessgi'): Observable<any> {
    const url = `${this.apiUrl}?category=${category}`;
    const headers = new HttpHeaders().set('X-Api-Key', this.apiKey);
    return this.http.get(url, { headers });
  }

  translateText(text: string, targetLang: string = 'ES'): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const body = new URLSearchParams();
    body.set('auth_key', this.deeplApiKey);
    body.set('text', text);
    body.set('target_lang', targetLang);

    return this.http.post(this.deeplApiUrl, body.toString(), { headers });
  }
}
