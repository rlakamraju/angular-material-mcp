// Minimal, realistic stand-in for @angular/cdk/drag-drop's shipped .d.ts, used to drive Phase 13
// (CDK support) test-first. Decorators are declared locally instead of imported from
// '@angular/core' so this file type-checks with `tsc --noEmit --experimentalDecorators` on its
// own, without a real @angular/core install. CdkDropList is a @Directive (not @Component) — it
// has no selector element of its own, only the `[cdkDropList]` attribute/`cdk-drop-list` tag —
// which makes it a second, independent exercise of the directive-only extraction path already
// proven against @angular/material's MatSort.
declare function Directive(config: Record<string, unknown>): ClassDecorator;
declare function Input(bindingPropertyName?: string): PropertyDecorator;
declare function Output(bindingPropertyName?: string): PropertyDecorator;
declare class EventEmitter<T> {
  subscribe(next?: (value: T) => void): { unsubscribe(): void };
}

/** Event fired when the user drops an item after dragging it inside a CdkDropList. */
export declare interface CdkDragDrop<T> {
  /** Index of the item when it was picked up. */
  previousIndex: number;

  /** Current index of the item. */
  currentIndex: number;

  /** Data associated with the drop container the item was picked up from. */
  previousContainer: T;

  /** Data associated with the drop container the item was dropped into. */
  container: T;
}

/**
 * Container that lets its child CdkDrag items be reordered or moved between connected lists.
 */
@Directive({
  selector: '[cdkDropList], cdk-drop-list',
  exportAs: 'cdkDropList',
})
export declare class CdkDropList<T = unknown> {
  /** Arbitrary data attached to this drop list, exposed on drop events. */
  @Input('cdkDropListData')
  data: T;

  /** Whether starting a dragging sequence from this container is disabled. */
  @Input('cdkDropListDisabled')
  disabled: boolean;

  /** The direction in which the drop list is oriented. */
  @Input('cdkDropListOrientation')
  orientation: 'horizontal' | 'vertical';

  /** Emits when the user drops an item inside the container. */
  @Output('cdkDropListDropped')
  readonly dropped: EventEmitter<CdkDragDrop<T>>;

  /** Emits when the user has moved a new drag item into this container. */
  @Output('cdkDropListEntered')
  readonly entered: EventEmitter<unknown>;

  /** Checks whether the list is currently able to receive the item being dragged. */
  isDragging(): boolean;

  /** Resets the container's state to prepare it for a new drag sequence. */
  reset(): void;
}
