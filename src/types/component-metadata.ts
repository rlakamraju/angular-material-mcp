/** Metadata extracted from a single Angular Material component. */
export interface ComponentMetadata {
  /** Component name as used in tool calls: "table", "paginator", "form-field" */
  name: string;

  /** Angular class name: "MatTable", "MatPaginator" */
  className: string;

  /** Package sub-entry: "@angular/material/table" */
  importPath: string;

  /** CSS selector: "mat-table, table[mat-table]" */
  selector: string;

  /** Category for filtering: "data-table", "form", "navigation", "layout", "popup", "button-indicator" */
  category: string;

  /** One-line description */
  description: string;

  /** Standalone import symbols needed */
  standaloneImports: string[];

  /** Legacy NgModule (for older projects) */
  ngModule: string;

  /** All @Input() properties */
  inputs: InputMetadata[];

  /** All @Output() events */
  outputs: OutputMetadata[];

  /** Public methods callable from template refs or component code */
  publicMethods: MethodMetadata[];

  /** CSS custom properties for styling */
  cssCustomProperties: string[];

  /** Components commonly used together with this one */
  composedWith: string[];

  /** Common mistakes and tips */
  gotchas: string[];

  /** Minimal standalone working example */
  minimalExample: string;

  /** Angular Material version this data is from (read from the installed package) */
  version: string;
}

export interface InputMetadata {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  /** Added/changed/deprecated in specific versions */
  since?: string;
  deprecated?: string;
}

/**
 * Curated per-component overlay merged onto extracted `ComponentMetadata` by `get_component_api`.
 * Covers exactly the fields extraction can't derive from `.d.ts` files alone and therefore always
 * hardcodes empty (`standaloneImports`, `ngModule`, `cssCustomProperties`, `composedWith`,
 * `gotchas`, `minimalExample`) — see `component-extractor.ts`/`directive-extractor.ts`.
 */
export interface ComponentOverlay {
  /** Component name, must match the filename (e.g. "table" for `table.json`). */
  name: string;
  standaloneImports: string[];
  ngModule: string;
  cssCustomProperties: string[];
  composedWith: string[];
  gotchas: string[];
  minimalExample: string;
}

export interface OutputMetadata {
  name: string;
  eventPayloadType: string;
  description: string;
}

export interface MethodMetadata {
  name: string;
  signature: string;
  description: string;
  returnType: string;
}

/** Multi-component wiring pattern. */
export interface CompositionPattern {
  name: string;
  description: string;
  components: string[];
  standaloneImports: string[];
  templateCode: string;
  componentCode: string;
  notes: string[];
  version: string;
}

/** Angular CLI schematic info. */
export interface SchematicInfo {
  name: string;
  command: string;
  description: string;
  options: SchematicOption[];
  generatedFiles: string[];
  example: string;
}

export interface SchematicOption {
  name: string;
  type: string;
  description: string;
  default?: string;
}
