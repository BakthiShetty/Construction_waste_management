import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) {}

  //  GET: List all users (Admin only) 
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`);
  }

  //  PATCH: Change user role
  changeUserRole(userId: string, newRole: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/user/${userId}/role`, { role: newRole });
  }

  //  DELETE: Remove a user
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/user/${userId}`);
  }
}
