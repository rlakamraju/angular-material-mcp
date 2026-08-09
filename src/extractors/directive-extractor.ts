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

export interface ExtractDirectivesOptions {
  /** npm package name these subpackages live under, e.g. "@angular/material" or "@angular/cdk". */
  packageName: string;
  /** Version string read from the resolved package's `package.json`. */
  version: string;
}

/**
 * Extracts one `ComponentMetadata` per `@Directive`-only class found across every entry file in
 * `parsed` (e.g. `MatSort`, which has no element selector of its own). Classes already handled
 * by `component-extractor.ts` (`@Component`) are skipped here.
 */
export function extractDirectives(
  parsed: ParsedPackage,
  options: ExtractDirectivesOptions,
): ComponentMetadata[] {
  const directives: ComponentMetadata[] = [];

  for (const entry of parsed.entries) {
    const sourceFile = parsed.program.getSourceFile(entry.filePath);
    if (!sourceFile) {
      continue;
    }

    for (const classDecl of findDecoratedClasses(sourceFile, 'Directive')) {
      const selector = getSelector(classDecl, 'Directive');
      if (!classDecl.name || selector === undefined) {
        continue;
      }

      directives.push({
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

  return directives;
}
