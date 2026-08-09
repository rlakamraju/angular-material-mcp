// Minimal, realistic stand-in for @angular/material/sort's shipped .d.ts, used to drive
// extractor development test-first (Phase 3). Decorators are declared locally instead of
// imported from '@angular/core' so this file type-checks with `tsc --noEmit --experimentalDecorators`
// on its own, without a real @angular/core install. MatSort is a @Directive (not @Component) —
// it has no selector element of its own, only the `[matSort]` attribute — which makes it the
// fixture that exercises the directive-only extraction path in Phase 5.
declare function Directive(config: Record<string, unknown>): ClassDecorator;
declare function Input(bindingPropertyName?: string): PropertyDecorator;
declare function Output(bindingPropertyName?: string): PropertyDecorator;
declare class EventEmitter<T> {
  subscribe(next?: (value: T) => void): { unsubscribe(): void };
}

export declare type SortDirection = 'asc' | 'desc' | '';

/** The current sort state. */
export declare interface Sort {
  /** The id of the column being sorted. */
  active: string;

  /** The sort direction. */
  direction: SortDirection;
}

/**
 * Container for MatSortables to manage the sort state and provide default sort parameters.
 */
@Directive({
  selector: '[matSort]',
  exportAs: 'matSort',
})
export declare class MatSort {
  /** The id of the most recently sorted MatSortable. */
  @Input('matSortActive')
  active: string;

  /** The sort direction of the currently active MatSortable. */
  @Input('matSortDirection')
  direction: SortDirection;

  /**
   * Whether to disable the user from clearing the sort by finishing the sort direction cycle.
   */
  @Input('matSortDisableClear')
  disableClear: boolean;

  /** Whether the sortable is disabled. */
  @Input('matSortDisabled')
  disabled: boolean;

  /** Event emitted when the user changes either the active sort or sort direction. */
  @Output()
  readonly sortChange: EventEmitter<Sort>;

  /** Sets the active sort id and determines the new sort direction. */
  sort(sortable: { id: string }): void;

  /** Returns the next sort direction of the active sortable, checking for potential overrides. */
  getNextSortDirection(sortable: { id: string }): SortDirection;
}
