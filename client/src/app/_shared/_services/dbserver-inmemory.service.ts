import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { Server } from '../../_models/server.interface';
import { API_BASE_URL, DB_EXTENDED_LIST_URL } from '../config';
import { BehaviorSubject, Subscription, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DBServerService implements OnDestroy {
  serverList$ = new BehaviorSubject<Server[]>([]);
  private subscriptions = new Subscription();
  constructor() {
    const httpClient: HttpClient = inject(HttpClient);
    const fetchDbSub = httpClient
      .post<Server[]>(`${API_BASE_URL}/fetchdb`, {
        dburl: DB_EXTENDED_LIST_URL,
      })
      .pipe(catchError((err) => of([])))
      .subscribe((list) => this.serverList$.next(list));
    this.subscriptions.add(fetchDbSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
