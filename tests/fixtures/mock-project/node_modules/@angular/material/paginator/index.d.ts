// Minimal, realistic stand-in for @angular/material/paginator's shipped .d.ts, used to drive
// extractor development test-first (Phase 3). Decorators are declared locally instead of
// imported from '@angular/core' so this file type-checks with `tsc --noEmit --experimentalDecorators`
// on its own, without a real @angular/core install.
declare function Component(config: Record<string, unknown>): ClassDecorator;
declare function Input(bindingPropertyName?: string): PropertyDecorator;
declare function Output(bindingPropertyName?: string): PropertyDecorator;
declare class EventEmitter<T> {
  subscribe(next?: (value: T) => void): { unsubscribe(): void };
}

/** Change event object emitted by MatPaginator. */
export declare class PageEvent {
  /** The current page index. */
  pageIndex: number;

  /** Index of the page that was selected previously. */
  previousPageIndex?: number;

  /** The current page size. */
  pageSize: number;

  /** The current total number of items being paged. */
  length: number;
}

/**
 * Component to provide navigation between paged information.
 */
@Component({
  selector: 'mat-paginator',
  exportAs: 'matPaginator',
})
export declare class MatPaginator {
  /** The zero-based page index of the displayed list of items. */
  @Input()
  pageIndex: number;

  /** The length of the total number of items that are being paginated. */
  @Input()
  length: number;

  /** Number of items to display on a page. */
  @Input()
  pageSize: number;

  /** The set of provided page size options to display to the user. */
  @Input()
  pageSizeOptions: number[];

  /** Whether to hide the page size selection UI from the user. */
  @Input()
  hidePageSize: boolean;

  /** Whether to show the first/last buttons UI to the user. */
  @Input()
  showFirstLastButtons: boolean;

  /** Whether the paginator is disabled. */
  @Input()
  disabled: boolean;

  /** Event emitted when the paginator changes the page size or page index. */
  @Output()
  readonly page: EventEmitter<PageEvent>;

  /** Advances to the next page if it exists. */
  nextPage(): void;

  /** Move back to the previous page if it exists. */
  previousPage(): void;

  /** Move to the first page if not already there. */
  firstPage(): void;

  /** Move to the last page if not already there. */
  lastPage(): void;

  /** Whether there is a previous page. */
  hasPreviousPage(): boolean;

  /** Whether there is a next page. */
  hasNextPage(): boolean;
}
