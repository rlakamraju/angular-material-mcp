// Minimal, realistic stand-in for @angular/material/table's shipped .d.ts, used to drive
// extractor development test-first (Phase 3). Decorators are declared locally instead of
// imported from '@angular/core' so this file type-checks with `tsc --noEmit --experimentalDecorators`
// on its own, without a real @angular/core install.
declare function Component(config: Record<string, unknown>): ClassDecorator;
declare function Input(bindingPropertyName?: string): PropertyDecorator;
declare type TrackByFunction<T> = (index: number, item: T) => unknown;

/**
 * Wrapper for the CdkTable with Material design styling.
 */
@Component({
  selector: 'mat-table, table[mat-table]',
  exportAs: 'matTable',
})
export declare class MatTable<T> {
  /** The table's source of data. */
  @Input()
  dataSource: unknown;

  /** Tracking function that will be used to check the differences in data changes. */
  @Input()
  trackBy: TrackByFunction<T>;

  /**
   * Whether to allow multiple rows per data object by evaluating which rows evaluate their
   * 'when' predicate to true.
   */
  @Input()
  multiTemplateDataRows: boolean;

  /** Whether the table should fix its layout, applying `table-layout: fixed`. */
  @Input()
  fixedLayout: boolean;

  /** Renders rows based on the table's latest set of data. */
  renderRows(): void;

  /** Updates the header sticky styles. */
  updateStickyHeaderRowStyles(): void;

  /** Updates the footer sticky styles. */
  updateStickyFooterRowStyles(): void;

  /** Updates the sticky styles for the columns. */
  updateStickyColumnStyles(): void;
}
