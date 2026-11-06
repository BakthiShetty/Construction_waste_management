import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ActivityLogDto {
  id: number;
  email: string;
  role: string;
  action: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
    private readonly baseUrl = `${environment.apiUrl}/Admin`;

  constructor(private http: HttpClient) {}

  // 🧩 Unified GET data
// For JSON (normal paginated data)
getData(
  type: 'users' | 'materials' | 'logs',
  page = 1,
  pageSize = 5
): Observable<any> {
  const params = {
    type,
    paginated: true,
    pageNumber: page,
    pageSize: pageSize
  };

  return this.http.get<any>(`${this.baseUrl}/`, { params });
}

// For PDF download (as Blob)
exportToPdf(type: 'users' | 'materials' | 'logs'): Observable<Blob> {
  const params = { type, export: true };

  return this.http.get(`${this.baseUrl}/`, {
    params,
    responseType: 'blob'  // no cast needed
  });
}

  // 🧹 DELETE USER
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/${userId}`);
  }

  // 🧹 DELETE MATERIAL
  deleteMaterial(materialId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/material/${materialId}`);
  }

  // 🔁 UPDATE ROLE
  updateUserRole(userId: string, newRole: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/user/${userId}/role`, JSON.stringify(newRole), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 🔐 BLOCK / UNBLOCK
  blockUser(userId: string, shouldBlock: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/user/${userId}/block`, JSON.stringify(shouldBlock), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
