import * as ts from 'typescript';

import type { InputMetadata, MethodMetadata, OutputMetadata } from '../types/component-metadata.js';

/** Reads the callee name of a decorator, e.g. `Component` for `@Component({...})`. */
function getDecoratorName(decorator: ts.Decorator): string | undefined {
  const expression = decorator.expression;
  if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression)) {
    return expression.expression.text;
  }
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  return undefined;
}

/** Finds every top-level class in `sourceFile` decorated with `@decoratorName`. */
export function findDecoratedClasses(
  sourceFile: ts.SourceFile,
  decoratorName: string,
): ts.ClassDeclaration[] {
  const classes: ts.ClassDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isClassDeclaration(statement) || !ts.canHaveDecorators(statement)) {
      continue;
    }
    const decorators = ts.getDecorators(statement) ?? [];
    if (decorators.some((decorator) => getDecoratorName(decorator) === decoratorName)) {
      classes.push(statement);
    }
  }
  return classes;
}

/** Returns the object-literal config argument of `@decoratorName({...})` on `classDecl`, if any. */
function getDecoratorConfig(
  classDecl: ts.ClassDeclaration,
  decoratorName: string,
): ts.ObjectLiteralExpression | undefined {
  if (!ts.canHaveDecorators(classDecl)) {
    return undefined;
  }
  const decorators = ts.getDecorators(classDecl) ?? [];
  const decorator = decorators.find((candidate) => getDecoratorName(candidate) === decoratorName);
  if (!decorator || !ts.isCallExpression(decorator.expression)) {
    return undefined;
  }
  const [firstArg] = decorator.expression.arguments;
  return firstArg && ts.isObjectLiteralExpression(firstArg) ? firstArg : undefined;
}

function getStringProperty(obj: ts.ObjectLiteralExpression, propName: string): string | undefined {
  for (const property of obj.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      ts.isIdentifier(property.name) &&
      property.name.text === propName &&
      ts.isStringLiteralLike(property.initializer)
    ) {
      return property.initializer.text;
    }
  }
  return undefined;
}

/** Reads the `selector` string from `@Component({...})`/`@Directive({...})`, if present. */
export function getSelector(
  classDecl: ts.ClassDeclaration,
  decoratorName: string,
): string | undefined {
  const config = getDecoratorConfig(classDecl, decoratorName);
  return config ? getStringProperty(config, 'selector') : undefined;
}

/** Joins a symbol's JSDoc comment into a single trimmed description string. */
export function getJsDocDescription(
  nameNode: ts.Node | undefined,
  checker: ts.TypeChecker,
): string {
  if (!nameNode) {
    return '';
  }
  const symbol = checker.getSymbolAtLocation(nameNode);
  if (!symbol) {
    return '';
  }
  return ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
}

function hasDecoratorNamed(member: ts.ClassElement, decoratorName: string): boolean {
  if (!ts.canHaveDecorators(member)) {
    return false;
  }
  const decorators = ts.getDecorators(member) ?? [];
  return decorators.some((decorator) => getDecoratorName(decorator) === decoratorName);
}

function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return (
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0
  );
}

/** Every `@Input()`-decorated property on a class, keyed by the property's own name. */
export function extractInputs(
  classDecl: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): InputMetadata[] {
  const inputs: InputMetadata[] = [];
  for (const member of classDecl.members) {
    if (!ts.isPropertyDeclaration(member) || !hasDecoratorNamed(member, 'Input')) {
      continue;
    }
    if (!ts.isIdentifier(member.name)) {
      continue;
    }
    inputs.push({
      name: member.name.text,
      type: checker.typeToString(checker.getTypeAtLocation(member)),
      description: getJsDocDescription(member.name, checker),
      required: false,
    });
  }
  return inputs;
}

/** `EventEmitter<T>` unwraps to `T`; anything else is reported as its own type text. */
function getEventPayloadTypeText(member: ts.PropertyDeclaration, checker: ts.TypeChecker): string {
  const type = checker.getTypeAtLocation(member);
  if (isTypeReference(type)) {
    const typeArgs = checker.getTypeArguments(type);
    if (typeArgs.length > 0 && typeArgs[0]) {
      return checker.typeToString(typeArgs[0]);
    }
  }
  return checker.typeToString(type);
}

/** Every `@Output()`-decorated property on a class. */
export function extractOutputs(
  classDecl: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): OutputMetadata[] {
  const outputs: OutputMetadata[] = [];
  for (const member of classDecl.members) {
    if (!ts.isPropertyDeclaration(member) || !hasDecoratorNamed(member, 'Output')) {
      continue;
    }
    if (!ts.isIdentifier(member.name)) {
      continue;
    }
    outputs.push({
      name: member.name.text,
      eventPayloadType: getEventPayloadTypeText(member, checker),
      description: getJsDocDescription(member.name, checker),
    });
  }
  return outputs;
}

/** Every non-private, non-static, non-lifecycle-hook method callable via a template ref. */
export function extractPublicMethods(
  classDecl: ts.ClassDeclaration,
  checker: ts.TypeChecker,
): MethodMetadata[] {
  const methods: MethodMetadata[] = [];
  for (const member of classDecl.members) {
    if (!ts.isMethodDeclaration(member) || !ts.isIdentifier(member.name)) {
      continue;
    }
    const modifiers = ts.canHaveModifiers(member) ? (ts.getModifiers(member) ?? []) : [];
    const isPrivateOrStatic = modifiers.some(
      (modifier) =>
        modifier.kind === ts.SyntaxKind.PrivateKeyword ||
        modifier.kind === ts.SyntaxKind.ProtectedKeyword ||
        modifier.kind === ts.SyntaxKind.StaticKeyword,
    );
    if (isPrivateOrStatic) {
      continue;
    }

    const signature = checker.getSignatureFromDeclaration(member);
    const returnType = signature
      ? checker.typeToString(checker.getReturnTypeOfSignature(signature))
      : 'unknown';
    const params = member.parameters.map((param) => param.getText()).join(', ');

    methods.push({
      name: member.name.text,
      signature: `${member.name.text}(${params}): ${returnType}`,
      description: getJsDocDescription(member.name, checker),
      returnType,
    });
  }
  return methods;
}
