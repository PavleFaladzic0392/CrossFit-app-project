import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private baseUrl = 'https://crossfit-app-projct-default-rtdb.europe-west1.firebasedatabase.app';

  constructor(private http: HttpClient) {}

  getData(path: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${path}.json`);
  }

  postData(path: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${path}.json`, data);
  }

  putData(path: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${path}.json`, data);
  }

  patchData(path: string, data: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${path}.json`, data);
  }

  deleteData(path: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${path}.json`);
  }

  reserveTraining(userId: string, treningId: string): Observable<any> {
    return this.patchData(`reservations/${userId}`, { [treningId]: true });
  }

  cancelReservation(userId: string, treningId: string): Observable<any> {
    return this.deleteData(`reservations/${userId}/${treningId}`);
  }

  checkReservation(userId: string, treningId: string): Observable<any> {
    return this.getData(`reservations/${userId}/${treningId}`);
  }
}
