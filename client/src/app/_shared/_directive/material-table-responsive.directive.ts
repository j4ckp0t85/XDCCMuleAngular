import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[matTableResponsive]'
})
export class MatTableResponsiveDirective implements AfterViewInit, OnDestroy {
  private readonly table = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  private readonly onDestroy$ = new Subject<boolean>();

  private thead!: HTMLTableSectionElement;
  private tbody!: HTMLTableSectionElement;

  private theadChanged$ = new BehaviorSubject(true);
  private tbodyChanged$ = new Subject<boolean>();

  private theadObserver = new MutationObserver(() =>
    this.theadChanged$.next(true)
  );
  private tbodyObserver = new MutationObserver(() =>
    this.tbodyChanged$.next(true)
  );



  ngAfterViewInit() {
    this.thead = this.table.nativeElement.querySelector('thead');
    this.tbody = this.table.nativeElement.querySelector('tbody');

    this.theadObserver.observe(this.thead, {
      characterData: true,
      subtree: true,
    });
    this.tbodyObserver.observe(this.tbody, { childList: true });
    /**
     * Set the "data-column-name" attribute for every body row cell, either on
     * thead row changes (e.g. language changes) or tbody rows changes (add, delete).
     */
    combineLatest([this.theadChanged$, this.tbodyChanged$])
      .pipe(
        map(() => ({
          headRow: this.thead.rows.item(0)!,
          bodyRows: this.tbody.rows,
        })),
        map(({ headRow, bodyRows }) => ({
          columnNames: [...headRow.children].map(
            (headerCell) => headerCell.textContent!
          ),
          rows: [...bodyRows].map((row) => [...row.children]),
        })),
        takeUntil(this.onDestroy$)
      )
      .subscribe(({ columnNames, rows }) => {
        rows.forEach((rowCells) =>
          rowCells.forEach((cell) =>
            this.renderer.setAttribute(
              cell,
              'data-column-name',
              columnNames[(cell as HTMLTableCellElement).cellIndex]
            )
          )
        );
      });
  }

  ngOnDestroy(): void {
    this.theadObserver.disconnect();
    this.tbodyObserver.disconnect();

    this.onDestroy$.next(true);
  }
}
