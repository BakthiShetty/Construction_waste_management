import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection: signalR.HubConnection | undefined;

  private _newMaterial = new BehaviorSubject<any | null>(null);
  public newMaterial$ = this._newMaterial.asObservable();

  // ✅ ADD THIS for material quantity changes
  private _materialChanged = new Subject<void>();
  public materialChanged$ = this._materialChanged.asObservable();

  constructor() {
    this.startConnection();
  }

  private startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/hubs/materials`)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected ✅'))
      .catch(err => console.error('SignalR Error:', err));

    this.hubConnection.on('MaterialPosted', (material) => {
      this._newMaterial.next(material);
    });
  }

  stopConnection(): void {
    this.hubConnection?.stop();
  }

  // ✅ METHOD TO CALL WHEN MATERIAL CHANGES
  notifyMaterialChanged(): void {
    this._materialChanged.next();
  }
}
