import type { ComponentMetadata, CompositionPattern, SchematicInfo } from './component-metadata.js';
import type { ImportStyle } from './config.js';

/** Lightweight component projection used by `list_components` and `search_components`. */
export interface ComponentSummary {
  name: string;
  className: string;
  category: string;
  description: string;
  composedWith: string[];
}

export interface ListComponentsInput {
  category?: string;
}

export interface ListComponentsResponse {
  version: string;
  components: ComponentSummary[];
}

export interface GetComponentApiInput {
  componentName: string;
  importStyle?: ImportStyle;
}

export type GetComponentApiResponse = ComponentMetadata;

export interface GetCompositionPatternInput {
  patternName: string;
}

export type GetCompositionPatternResponse = CompositionPattern;

export interface GetThemingGuideInput {
  topic: string;
}

export interface ThemingGuide {
  topic: string;
  version: string;
  approach: string;
  setupCode: string;
  explanation: string;
  relatedTopics: string[];
  gotchas: string[];
}

export type GetThemingGuideResponse = ThemingGuide;

export interface GetSchematicsUsageInput {
  schematicName: string;
}

export type GetSchematicsUsageResponse = SchematicInfo;

export interface SearchComponentsInput {
  query: string;
}

export interface SearchResult extends ComponentSummary {
  relevanceScore: number;
}

export interface SearchComponentsResponse {
  query: string;
  results: SearchResult[];
}

/** Shape returned by tool handlers that fail — surfaced via MCP's `isError: true` content. */
export interface ToolErrorResponse {
  isError: true;
  message: string;
}
