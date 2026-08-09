import type { ComponentMetadata } from '../types/component-metadata.js';
import {
  extractInputs,
  extractOutputs,
  extractPublicMethods,
  findDecoratedClasses,
  getJsDocDescription,
  getSelector,
} from './ast-utils.js';
import { getCategoryForSubpackage } from './category-lookup.js';
import type { ParsedPackage } from './ts-parser.js';

export interface ExtractComponentsOptions {
  /** npm package name these subpackages live under, e.g. "@angular/material". */
  packageName: string;
  /** Version string read from the resolved package's `package.json`. */
  version: string;
}

/**
 * Extracts one `ComponentMetadata` per `@Component`-decorated class found across every entry
 * file in `parsed`. Classes decorated with `@Directive` only (e.g. `MatSort`) are left to
 * `directive-extractor.ts`.
 */
export function extractComponents(
  parsed: ParsedPackage,
  options: ExtractComponentsOptions,
): ComponentMetadata[] {
  const components: ComponentMetadata[] = [];

  for (const entry of parsed.entries) {
    const sourceFile = parsed.program.getSourceFile(entry.filePath);
    if (!sourceFile) {
      continue;
    }

    for (const classDecl of findDecoratedClasses(sourceFile, 'Component')) {
      const selector = getSelector(classDecl, 'Component');
      if (!classDecl.name || selector === undefined) {
        continue;
      }

      components.push({
        name: entry.subpackage,
        className: classDecl.name.text,
        importPath: `${options.packageName}/${entry.subpackage}`,
        selector,
        category: getCategoryForSubpackage(entry.subpackage),
        description: getJsDocDescription(classDecl.name, parsed.checker),
        standaloneImports: [],
        ngModule: '',
        inputs: extractInputs(classDecl, parsed.checker),
        outputs: extractOutputs(classDecl, parsed.checker),
        publicMethods: extractPublicMethods(classDecl, parsed.checker),
        cssCustomProperties: [],
        composedWith: [],
        gotchas: [],
        minimalExample: '',
        version: options.version,
      });
    }
  }

  return components;
}
