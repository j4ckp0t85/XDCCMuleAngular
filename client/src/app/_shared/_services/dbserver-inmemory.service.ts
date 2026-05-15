import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { Server } from '../../_models/server.interface';
import { API_BASE_URL, DB_EXTENDED_LIST_URL } from '../config';
import { BehaviorSubject, Subscription, catchError, map, of } from 'rxjs';
import { parsePickle } from '../pickle-parser';

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
      .pipe(
        map((servers) => {
          console.log(`Successfully received ${servers?.length || 0} servers from API`);
          return servers || [];
        }),
        catchError((err) => {
          console.error('Error fetching DB:', err);
          return of([]);
        })
      )
      .subscribe((list) => this.serverList$.next(list));
    this.subscriptions.add(fetchDbSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
