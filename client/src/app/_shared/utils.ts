import { defer, EMPTY, forkJoin, NEVER, Observable, of, Subject } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

// finalizeWithValue - provides (unlike original finalize from rxjs) source$'s last emitted value (if any) in format {value: <lastValue>}
// If source$ completes with noe emitted value - provide undefined.
// Author - Benlesh, taken here: https://github.com/ReactiveX/rxjs/issues/4803#issuecomment-496711335

export function finalizeWithValue<T>(
  callback: (value: T | any) => void
): (source: Observable<any>) => Observable<T> {
  return (source: Observable<T>): Observable<any> =>
    defer(() => {
      let lastValue: T;
      return source.pipe(
        tap((value) => (lastValue = value)),
        finalize(() => callback(lastValue ? { value: lastValue } : lastValue))
      );
    });
}

export function forkJoinWithProgress(
  arrayOfObservables: any[]
): Observable<any[]> {
  return defer(() => {
    let counter: number = 0;
    const percent$: Subject<number> = new Subject();

    const modilefiedObservablesList: Observable<any>[] = arrayOfObservables.map(
      (item, index) =>
        item.pipe(
          catchError(() => of('')),
          finalize(() => {
            const percentValue: number =
              (++counter * 100) / arrayOfObservables.length;
            percent$.next(percentValue);
          })
        )
    );

    const finalResult$: Observable<any[]> = forkJoin(
      modilefiedObservablesList
    ).pipe(
      tap(() => {
        percent$.next(100);
        percent$.complete();
      })
    );

    return of([finalResult$, percent$.asObservable()]);
  });
}
