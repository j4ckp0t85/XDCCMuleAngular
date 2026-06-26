import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Server } from '../../_models/server.interface';
import { API_BASE_URL, DB_EXTENDED_LIST_URL } from '../config';
import { catchError, map, of } from 'rxjs';

@Service()
export class DBServerService {
  private readonly httpClient = inject(HttpClient);

  readonly serverListResource = rxResource<Server[], void>({
    stream: () =>
      this.httpClient
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
            return of([] as Server[]);
          })
        ),
  });

  /** Convenience accessor: returns the server list or empty array */
  readonly serverList = this.serverListResource.value;
}
