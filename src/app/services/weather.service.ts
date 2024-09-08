import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private apiKey = 'e9528feb27aea2c446d82f2fc7fd190a';
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private http: HttpClient) {}

  getWeather(city: string, countryCode: string): Observable<any> {
    const url = `${this.apiUrl}?q=${city},${countryCode}&units=metric&lang=es&appid=${this.apiKey}`;
    return this.http.get(url);
  }
}
