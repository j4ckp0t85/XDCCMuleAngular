import { HttpRequest, HttpHeaders, HttpEvent, HttpHandlerFn, HttpInterceptorFn } from '@angular/common/http';
import { Observable } from 'rxjs';

export const httpInterceptorFn: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const httpRequest = req.clone({
    headers: new HttpHeaders({
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      Pragma: 'no-cache',
      Expires: 'Sat, 01 Jan 2000 00:00:00 GMT',
    }),
  });

  return next(httpRequest);
};
