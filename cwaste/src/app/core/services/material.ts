import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Material } from '../../features/admin/material-list/material-list';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class MaterialService {
  private baseUrl = `${environment.apiUrl}/Materials`;

  constructor(private http: HttpClient) {}

  // Get all available materials (for everyone)
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}?type=all`);
  }

  // Get materials of the current donor
  getMyMaterials(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}?type=mine`);
  }

  // Get material by ID
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?type=single&id=${id}`);
  }

  // Create a new material (multipart/form-data)
  create(data: FormData): Observable<any> {
    return this.http.post<any>(this.baseUrl, data);
  }

  // Update existing material (multipart/form-data)
  updateMaterial(id: number, data: FormData): Observable<any> {
    return this.http.put(`${this.baseUrl}?id=${id}`, data);
  }

  // Delete material
  deleteMaterial(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}?id=${id}`);
  }

  // Admin pagination (separate endpoint)
  getAllPaginated(page: number = 1, pageSize: number = 4): Observable<{ data: Material[], totalCount: number }> {
    return this.http.get<{ data: Material[], totalCount: number }>(
      `http://localhost:5004/api/Admin/pagination_materials?pageNumber=${page}&pageSize=${pageSize}`
    );
  }
}
