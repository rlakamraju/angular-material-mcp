import { z } from 'zod';

/**
 * Structurally mirrors `CompositionPattern`/`ThemingGuide`/`SchematicInfo` from
 * `src/types/component-metadata.ts` / `src/types/tool-responses.ts`. Not pinned to those
 * interfaces via `z.ZodType<T>` because zod's inferred output for optional fields
 * (`T | undefined`) conflicts with `exactOptionalPropertyTypes`; `readCuratedData` casts to `T`
 * after a successful `.strict()` parse instead, so an unknown field or wrong shape is still
 * caught at runtime by `validate-data` and by every data-consuming tool.
 */
export const compositionPatternSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    components: z.array(z.string().min(1)).min(1),
    standaloneImports: z.array(z.string().min(1)),
    templateCode: z.string().min(1),
    componentCode: z.string().min(1),
    notes: z.array(z.string()),
    version: z.string().min(1),
  })
  .strict();

const schematicOptionSchema = z
  .object({
    name: z.string().min(1),
    type: z.string().min(1),
    description: z.string().min(1),
    default: z.string().optional(),
  })
  .strict();

export const schematicInfoSchema = z
  .object({
    name: z.string().min(1),
    command: z.string().min(1),
    description: z.string().min(1),
    options: z.array(schematicOptionSchema),
    generatedFiles: z.array(z.string()),
    example: z.string().min(1),
  })
  .strict();

export const themingGuideSchema = z
  .object({
    topic: z.string().min(1),
    version: z.string().min(1),
    approach: z.string().min(1),
    setupCode: z.string().min(1),
    explanation: z.string().min(1),
    relatedTopics: z.array(z.string()),
    gotchas: z.array(z.string()),
  })
  .strict();
