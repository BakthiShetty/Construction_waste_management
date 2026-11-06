import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class RequestService {
  private baseUrl = `${environment.apiUrl}/Requests`;

  constructor(private http: HttpClient) {}

  // POST /api/requests
  create(request: { materialId: number; quantity: number }): Observable<any> {
    return this.http.post(this.baseUrl, request);
  }

  // GET /api/requests?type=my (Receiver requests)
  getMyRequests(): Observable<any[]> {
    const params = new HttpParams().set('type', 'my');
    return this.http.get<any[]>(this.baseUrl, { params });
  }

  // GET /api/requests?type=material&id=...
  getRequestsForMaterial(materialId: number): Observable<any[]> {
    const params = new HttpParams()
      .set('type', 'material')
      .set('id', materialId);
    return this.http.get<any[]>(this.baseUrl, { params });
  }

  // GET /api/requests?type=mine (Donor: requests for their materials)
  getRequestsForDonor(): Observable<any[]> {
    const params = new HttpParams().set('type', 'mine');
    return this.http.get<any[]>(this.baseUrl, { params });
  }

  // PUT /api/requests?id=5
  updateStatus(requestId: number, status: string): Observable<any> {
    const params = new HttpParams().set('id', requestId);
    return this.http.put(`${this.baseUrl}`, { status }, { params });
  }

  // DELETE /api/requests?id=5
  deleteRequest(requestId: number): Observable<void> {
    const params = new HttpParams().set('id', requestId);
    return this.http.delete<void>(this.baseUrl, { params });
  }
}
