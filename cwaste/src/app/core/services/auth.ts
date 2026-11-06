
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiUrl}/Auth`;
  private tokenKey = 'auth_token';

  private _role = new BehaviorSubject<string | null>(null);
  role$ = this._role.asObservable();

  constructor(private http: HttpClient) {
    const role = this.getRoleFromToken();
    if (role) this._role.next(role);
  }

  // POST: Login
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/login`, credentials).pipe(
      map(res => {
        this.saveToken(res.token);
        return res;
      })
    );
  }

  // POST: Register
  register(data: { email: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  // GET: Current profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/me`);
  }

  // Save token and extract role
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    const role = this.getRoleFromToken();
    if (role) this._role.next(role);
  }

  // Remove token
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this._role.next(null);
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Decode role from token
  getRoleFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }

  // Check login
  isLoggedIn(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  get role(): string | null {
    return this._role.value;
  }

  // Check expiry
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp && exp < now;
    } catch {
      return true;
    }
  }
}
