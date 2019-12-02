const path = require('path');
const ts = require('typescript');

const BLOCK_FLAG = Symbol('block');
const GLOBAL_REQUIRED_KEY = Symbol('global_required_key');

const EMPTY_TYPE = 0;
const VARIABLE_TYPE = 1 << 0;
const LABEL_TYPE = 1 << 1;
const THIS_TYPE = 1 << 2;
const PROPERTY_TYPE = 1 << 3;
const TYPE_TYPE = 1 << 4;
const FUNC_TYPE = 1 << 5;
const CLASS_TYPE = 1 << 6;
const INTERFACE_TYPE = 1 << 7;

// TODO: a bunch of todo
// code refine.. data structure, iteration... now its too silly
// test
// decorator & declaration
// compile option

function buildFilePath(file) {
  return path.resolve(__dirname, file);
}

const srcFiles = [
  // statement
  // buildFilePath('../test_file/test_do_statement.ts'),
  // buildFilePath('../test_file/test-if-statement.ts')
  // buildFilePath('../test_file/test-while-statement.ts')
  // buildFilePath('../test_file/test_label_statement.ts'),
  // buildFilePath('../test_file/test_for_statement.ts'),
  // buildFilePath('../test_file/test_forof_statement.ts'),
  // buildFilePath('../test_file/test_forin_statement.ts'),
  // buildFilePath('../test_file/test_switch_statement.ts'),
  // buildFilePath('../test_file/test-try-catch-statement.ts')
  // buildFilePath('../test_file/test_throw_statement.ts'),
  // declaration
  // buildFilePath('../test_file/test-function-decl.ts')
  // buildFilePath('../test_file/test-class-decl.ts')
  // buildFilePath('../test_file/test_interface_decl.ts'),
  buildFilePath('../test_file/test-enum-decl.ts')
  // buildFilePath('../test_file/test-type-alias-decl.ts')
];
const outDir = path.resolve(__dirname, '../dist');

const compileOptions = {
  outDir,
  sourceMap: false,
  declaration: false,
  emitDecoratorMetadata: true,
  experimentalDecorators: true,
  allowJs: true,
  moduleResolution: ts.ModuleResolutionKind.node,
  target: ts.ScriptTarget.ES2015,
  removeComments: true,
  lib: ['es2017', 'es2016', 'es2015', 'dom']
};

// expression

function parseExpression(expr, type = VARIABLE_TYPE) {
  if (!expr || ts.isLiteralExpression(expr)) {
    return [];
  }
  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.reduce((prev, el) => {
      return [...prev, ...parseIdentifierOrLiteralOrExpression(el, type)];
    }, []);
  }
  if (ts.isObjectLiteralExpression(expr)) {
    return expr.properties.reduce((prev, prop) => {
      return [
        ...prev,
        ...(ts.isComputedPropertyName(prop.name) ? parseIdentifierOrLiteralOrExpression(prop.name.expression, type) : []),
        ...parseIdentifierOrLiteralOrExpression(prop.initializer, type)
      ];
    }, []);
  }
  if (ts.isPropertyAccessExpression(expr)) {
    const chainType = expr.expression.kind === ts.SyntaxKind.ThisKeyword ? THIS_TYPE : PROPERTY_TYPE;
    return [...parseIdentifierOrLiteralOrExpression(expr.expression, type), { key: [expr.name.escapedText], type: chainType }];
  }
  if (ts.isElementAccessExpression(expr)) {
    return [
      ...parseIdentifierOrLiteralOrExpression(expr.expression, type),
      ...parseIdentifierOrLiteralOrExpression(expr.argumentExpression, type)
    ];
  }
  if (ts.isCallExpression(expr)) {
    let result = parseIdentifierOrLiteralOrExpression(expr.expression, type);
    result = expr.arguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrLiteralOrExpression(arg, type)];
    }, result);
    if (!expr.typeArguments) {
      return result;
    }
    return expr.typeArguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrLiteralOrExpression(arg.typeName, TYPE_TYPE)];
    }, result);
  }
  if (ts.isNewExpression(expr)) {
    const result = [
      ...parseIdentifierOrLiteralOrExpression(expr.expression, type),
      ...expr.arguments.reduce((prev, arg) => {
        return [...prev, ...parseIdentifierOrLiteralOrExpression(arg, type)];
      }, [])
    ];
    if (!expr.typeArguments) {
      return result;
    }
    return expr.typeArguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrLiteralOrExpression(arg.typeName, TYPE_TYPE)];
    }, result);
  }
  if (ts.isTaggedTemplateExpression(expr)) {
    const result = [...parseIdentifierOrLiteralOrExpression(expr.tag, type), ...parseIdentifierOrLiteralOrExpression(expr.template, type)];
    if (!expr.typeArguments) {
      return result;
    }
    return expr.typeArguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrLiteralOrExpression(arg.typeName, TYPE_TYPE)];
    }, result);
  }
  // TODO: TypeAssertionExpression
  if (ts.isTypeAssertion(expr)) {
    return [
      ...parseIdentifierOrLiteralOrExpression(expr.type.typeName, TYPE_TYPE),
      ...parseIdentifierOrLiteralOrExpression(expr.expression, type)
    ];
  }
  if (ts.isParenthesizedExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.expression, type);
  }
  if (ts.isFunctionExpression(expr)) {
    // TODO: recursively call function
    return [];
  }
  if (ts.isArrowFunction(expr)) {
    // TODO: recursively call function
    return [];
  }
  if (ts.isDeleteExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.expression, type);
  }
  if (ts.isTypeOfExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.expression, type);
  }
  if (ts.isVoidExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.expression, type);
  }
  if (ts.isAwaitExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.expression, type);
  }
  if (ts.isPrefixUnaryExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.operand, type);
  }
  if (ts.isPostfixUnaryExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.operand, type);
  }
  if (ts.isBinaryExpression(expr)) {
    return [...parseIdentifierOrLiteralOrExpression(expr.left, type), ...parseIdentifierOrLiteralOrExpression(expr.right, type)];
  }
  if (ts.isConditionalExpression(expr)) {
    return [
      ...parseIdentifierOrLiteralOrExpression(expr.condition, type),
      ...parseIdentifierOrLiteralOrExpression(expr.whenTrue, type),
      ...parseIdentifierOrLiteralOrExpression(expr.whenFalse, type)
    ];
  }
  if (ts.isTemplateExpression(expr)) {
    return expr.templateSpans.reduce((prev, span) => {
      return [...prev, ...parseIdentifierOrLiteralOrExpression(span.expression, type)];
    }, []);
  }
  if (ts.isYieldExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.expression, type);
  }
  if (ts.isSpreadElement(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.expression, type);
  }
  if (ts.isClassExpression(expr)) {
    // TODO: parse class
    return [];
  }
  if (ts.isOmittedExpression(expr)) {
    return [];
  }
  if (ts.isExpressionWithTypeArguments(expr)) {
    const result = parseIdentifierOrLiteralOrExpression(expr.expression, type);
    if (!expr.typeArguments) {
      return result;
    }
    return expr.typeArguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrLiteralOrExpression(arg.typeName, TYPE_TYPE)];
    }, result);
  }
  if (ts.isAsExpression(expr)) {
    return [
      ...parseIdentifierOrLiteralOrExpression(expr.expression, type),
      ...parseIdentifierOrLiteralOrExpression(expr.type.typeName, TYPE_TYPE)
    ];
  }
  if (ts.isNonNullExpression(expr)) {
    return parseIdentifierOrLiteralOrExpression(expr.expression, type);
  }
  if (ts.isMetaProperty(expr)) {
    return [];
  }
}

function parseIdentifierOrLiteralOrExpression(node, type = VARIABLE_TYPE) {
  if (ts.SyntaxKind.FirstLiteralToken <= node.kind && node.kind <= ts.SyntaxKind.LastLiteralToken) {
    return [];
  }
  if (node.kind === ts.SyntaxKind.ThisKeyword) {
    return [];
  }
  if (ts.isIdentifier(node)) {
    return [{ key: node.escapedText, type }];
  }
  return parseExpression(node, type);
}

function collectRequiredForIdentifierOrExpr(expr, type = EMPTY_TYPE) {
  if (!expr) return {};
  const transformed = {};
  const required = parseIdentifierOrLiteralOrExpression(expr);
  required.forEach(varr => {
    transformed[varr.key] = type || transformed[varr.key] | varr.type;
  });
  return transformed;
}

// statements

/**
 * collect required variables from a single statement
 * @param {*} stmt
 * @param {*} scopeStacks
 */
function collectRequiredForStmt(stmt, scopeStacks) {
  if (ts.isBlock(stmt)) {
    // we know JS block scope is tricky and we have to respect it.
    // For example, `var` do not care about block, we need to add a flag.
    const blockScope = { [BLOCK_FLAG]: true };
    // enter scope
    scopeStacks.push(blockScope);
    const required = stmt.statements.reduce((prev, st) => {
      return { ...prev, ...collectRequiredForStmt(st, scopeStacks) };
    }, {});
    const checked = checkCurrentScope(blockScope, required);
    // leave scope
    scopeStacks.pop();
    return checked;
  }
  if (ts.isEmptyStatement(stmt)) {
    // for empty statement, return empty required directly
    return {};
  }
  if (ts.isVariableStatement(stmt)) {
    return collectRequiredForVariableDeclList(stmt.declarationList, scopeStacks);
  }
  if (ts.isExpressionStatement(stmt)) {
    return collectRequiredForIdentifierOrExpr(stmt.expression);
  }
  if (ts.isIfStatement(stmt)) {
    return {
      ...collectRequiredForIdentifierOrExpr(stmt.expression),
      ...collectRequiredForStmt(stmt.thenStatement, scopeStacks),
      ...(stmt.elseStatement ? collectRequiredForStmt(stmt.elseStatement, scopeStacks) : {})
    };
  }
  if (ts.isDoStatement(stmt)) {
    return {
      ...collectRequiredForIdentifierOrExpr(stmt.expression),
      ...collectRequiredForStmt(stmt.statement, scopeStacks)
    };
  }
  if (ts.isWhileStatement(stmt)) {
    return {
      ...collectRequiredForIdentifierOrExpr(stmt.expression),
      ...collectRequiredForStmt(stmt.statement, scopeStacks)
    };
  }
  if (ts.isForStatement(stmt)) {
    const localScope = { [BLOCK_FLAG]: true };
    scopeStacks.push(localScope);
    let required = {};
    if (ts.isVariableDeclarationList(stmt.initializer)) {
      required = {
        ...required,
        ...collectRequiredForVariableDeclList(stmt.initializer, scopeStacks)
      };
    } else {
      required = {
        ...required,
        ...collectRequiredForIdentifierOrExpr(stmt.initializer)
      };
    }
    const checked = checkCurrentScope(localScope, {
      ...required,
      ...collectRequiredForIdentifierOrExpr(stmt.condition),
      ...collectRequiredForIdentifierOrExpr(stmt.incrementor),
      ...collectRequiredForStmt(stmt.statement, scopeStacks)
    });
    scopeStacks.pop();
    return checked;
  }
  if (ts.isForInStatement(stmt)) {
    const localScope = { [BLOCK_FLAG]: true };
    scopeStacks.push(localScope);
    let required = {};
    if (ts.isVariableDeclarationList(stmt.initializer)) {
      required = {
        ...required,
        ...collectRequiredForVariableDeclList(stmt.initializer, scopeStacks)
      };
    } else {
      required = {
        ...required,
        ...collectRequiredForIdentifierOrExpr(stmt.initializer)
      };
    }
    const checked = checkCurrentScope(localScope, {
      ...required,
      ...collectRequiredForIdentifierOrExpr(stmt.expression),
      ...collectRequiredForStmt(stmt.statement, scopeStacks)
    });
    scopeStacks.pop();
    return checked;
  }
  if (ts.isForOfStatement(stmt)) {
    const localScope = { [BLOCK_FLAG]: true };
    scopeStacks.push(localScope);
    let required = {};
    if (ts.isVariableDeclarationList(stmt.initializer)) {
      required = {
        ...required,
        ...collectRequiredForVariableDeclList(stmt.initializer, scopeStacks)
      };
    } else {
      required = {
        ...required,
        ...collectRequiredForIdentifierOrExpr(stmt.initializer)
      };
    }
    const checked = checkCurrentScope(localScope, {
      ...required,
      ...collectRequiredForIdentifierOrExpr(stmt.expression),
      ...collectRequiredForStmt(stmt.statement, scopeStacks)
    });
    scopeStacks.pop();
    return checked;
  }
  if (ts.isContinueStatement(stmt)) {
    return collectRequiredForIdentifierOrExpr(stmt.label, LABEL_TYPE);
  }
  if (ts.isBreakStatement(stmt)) {
    return collectRequiredForIdentifierOrExpr(stmt.label, LABEL_TYPE);
  }
  if (ts.isReturnStatement(stmt)) {
    return collectRequiredForIdentifierOrExpr(stmt.expression);
  }
  if (ts.isWithStatement(stmt)) {
    console.log('Warning: we do not support tree-shake for WithStatement. Also it is not a recommended pattern.');
    return {
      ...parseIdentifierOrLiteralOrExpression(stmt.expression),
      ...collectRequiredForStmt(stmt.statement.scopeStacks)
    };
  }
  if (ts.isSwitchStatement(stmt)) {
    const required = stmt.caseBlock.clauses.reduce((prev, clause) => {
      let result = {
        ...prev,
        ...clause.statements.reduce((prev, stmt) => {
          return {
            ...prev,
            ...collectRequiredForStmt(stmt, scopeStacks)
          };
        }, {})
      };
      if (ts.isCaseClause(clause)) {
        result = {
          ...result,
          ...collectRequiredForIdentifierOrExpr(clause.expression)
        };
      }
      return result;
    }, {});
    return {
      ...required,
      ...collectRequiredForIdentifierOrExpr(stmt.expression)
    };
  }
  if (ts.isLabeledStatement(stmt)) {
    const key = stmt.label.escapedText;
    const oldType = scopeStacks[scopeStacks.length - 1][key] || 0;
    const localStack = { [key]: LABEL_TYPE | oldType, [BLOCK_FLAG]: true };
    scopeStacks.push(localStack);
    const transformed = checkCurrentScope(localStack, {
      ...collectRequiredForStmt(stmt.statement, scopeStacks)
    });
    scopeStacks.pop();
    return transformed;
  }
  if (ts.isThrowStatement(stmt)) {
    return collectRequiredForIdentifierOrExpr(stmt.expression);
  }
  if (ts.isTryStatement(stmt)) {
    let required = collectRequiredForStmt(stmt.tryBlock, scopeStacks);
    if (stmt.catchClause) {
      const localScope = { [BLOCK_FLAG]: true };
      scopeStacks.push(localScope);
      required = {
        ...required,
        ...collectRequiredForVariableDecl(stmt.catchClause.variableDeclaration, scopeStacks, true),
        ...collectRequiredForStmt(stmt.catchClause.block, scopeStacks)
      };
      scopeStacks.pop();
    }
    if (stmt.finallyBlock) {
      required = {
        ...required,
        ...collectRequiredForStmt(stmt.finallyBlock, scopeStacks)
      };
    }
    return required;
  }
  if (ts.isDebuggerStatement(stmt)) {
    return;
  }
}

// declarations

/**
 * @example: const a = 3;
 */
function collectRequiredForVariableDecl(decl, scopeStacks, blockScoped) {
  let index = scopeStacks.length - 1;
  const localStack = scopeStacks[index];
  // skip global scope
  const required = checkCurrentScope(index === 0 ? {} : localStack, collectRequiredForIdentifierOrExpr(decl.initializer));
  if (blockScoped) {
    localStack[decl.name.escapedText] = VARIABLE_TYPE;
  } else {
    while (index >= 0 && scopeStacks[index][BLOCK_FLAG]) {
      index -= 1;
    }
    scopeStacks[index][decl.name.escapedText] = VARIABLE_TYPE;
  }
  if (index === 0) {
    scopeStacks[0][GLOBAL_REQUIRED_KEY][decl.name.escapedText] = required;
  }
  return required;
}

/**
 * @example: const a = 3, b = 4;
 */
function collectRequiredForVariableDeclList(decls, scopeStacks) {
  let blockScoped = false;
  if (decls.flags & ts.NodeFlags.BlockScoped) {
    blockScoped = true;
  }
  return decls.declarations.reduce((prev, decl) => {
    return {
      ...prev,
      ...collectRequiredForVariableDecl(decl, scopeStacks, blockScoped)
    };
  }, {});
}

/**
 * @example: function func(p1, p2) {}
 */
function collectRequiredForFunctionDecl(decl, scopeStacks) {
  // function has its own scope
  const functionScope = {};
  let required = {};
  decl.parameters.forEach(param => {
    required = {
      ...required,
      ...collectRequiredForIdentifierOrExpr(param.initializer)
    };
    functionScope[param.name.escapedText] = VARIABLE_TYPE;
  });
  scopeStacks.push(functionScope);
  required = {
    ...required,
    ...decl.body.statements.reduce((prev, stmt) => {
      return {
        ...prev,
        ...(isStatementKindButNotDeclarationKind(stmt)
          ? collectRequiredForStmt(stmt, scopeStacks)
          : collectRequiredForDecl(stmt, scopeStacks))
      };
    }, {})
  };
  const checked = checkCurrentScope(functionScope, required);
  // leave function scope
  scopeStacks.pop();
  return checked;
}

function collectRequiredForTypeParameterDecl(decl, scopeStacks) {
  let required = {};
  const localScope = scopeStacks[scopeStacks.length - 1];
  localScope[decl.name.escapedText] = TYPE_TYPE;
  // TODO: make sure these two could be removed
  // if (decl.constraint) {
  //   required = {
  //     ...required,
  //     ...collectRequiredForIdentifierOrExpr(decl.constraint.typeName)
  //   };
  // }
  // if (decl.default) {
  //   required = {
  //     ...required,
  //     ...collectRequiredForIdentifierOrExpr(decl.default.typeName)
  //   };
  // }
  return required;
}

function collectRequiredForPropertyDecl(decl, scopeStacks) {
  if (!decl.initializer) {
    return {};
  }
  return collectRequiredForIdentifierOrExpr(decl.initializer);
}

function collectRequiredForMethodDecl(decl, scopeStacks) {
  const methodScope = {};
  let required = {};
  decl.parameters.forEach(param => {
    required = {
      ...required,
      ...collectRequiredForIdentifierOrExpr(param.initializer)
    };
    methodScope[param.name.escapedText] = VARIABLE_TYPE;
  });
  scopeStacks.push(methodScope);
  required = {
    ...required,
    ...decl.body.statements.reduce((prev, stmt) => {
      return {
        ...prev,
        ...collectRequiredForStmt(stmt, scopeStacks)
      };
    }, {})
  };
  const checked = checkCurrentScope(methodScope, required);
  // leave function scope
  scopeStacks.pop();
  return checked;
}

function collectRequiredForEnumDecl(decl, scopeStacks) {
  return decl.members.reduce((prev, member) => {
    return {
      ...prev,
      ...collectRequiredForIdentifierOrExpr(member.initializer)
    };
  }, {});
}

function collectRequiredForInterfaceDecl(decl, scopeStacks) {
  let required = {};
  if (decl.typeParameters && decl.typeParameters.length) {
    required = decl.typeParameters.reduce((prev, param) => {
      return {
        ...prev,
        ...collectRequiredForTypeParameterDecl(param, scopeStacks)
      };
    }, {});
  }
  if (decl.heritageClauses) {
    required = {
      ...required,
      ...decl.heritageClauses.reduce((prev, clause) => {
        return {
          ...prev,
          ...clause.types.reduce((pr, type) => {
            return {
              ...pr,
              ...collectRequiredForIdentifierOrExpr(type)
            };
          }, {})
        };
      }, {})
    };
  }
  required = {
    ...required,
    ...decl.members.reduce((prev, member) => {
      if (ts.isTypeReferenceNode(member.type)) {
        return {
          ...prev,
          ...collectRequiredForIdentifierOrExpr(member.type.typeName, TYPE_TYPE)
        };
      }
      return { ...prev };
    }, {})
  };
  return required;
}

function collectRequiredForClassDecl(decl, scopeStacks) {
  let required = {};
  const classScope = { this: VARIABLE_TYPE };
  scopeStacks.push(classScope);
  if (decl.typeParameters && decl.typeParameters.length) {
    required = decl.typeParameters.reduce((prev, param) => {
      return {
        ...prev,
        ...collectRequiredForTypeParameterDecl(param, scopeStacks)
      };
    }, {});
  }
  if (decl.heritageClauses) {
    required = {
      ...required,
      ...decl.heritageClauses.reduce((prev, clause) => {
        return {
          ...prev,
          ...clause.types.reduce((pr, type) => {
            return {
              ...pr,
              ...collectRequiredForIdentifierOrExpr(type)
            };
          }, {})
        };
      }, {})
    };
  }
  required = {
    ...required,
    ...decl.members.reduce((prev, member) => {
      return {
        ...prev,
        ...collectRequiredForDecl(member, scopeStacks)
      };
    }, {})
  };
  required = checkCurrentScope(classScope, required);
  scopeStacks.pop();
  return required;
}

function collectRequiredForTypeAliasDecl(decl, scopeStacks) {
  // We actually dont need parse any TypeAliasDeclaration since it will be omitted by compiler
  return {};

  // let required = {};
  // if (decl.typeParameters && decl.typeParameters.length) {
  //   required = decl.typeParameters.reduce((prev, param) => {
  //     return {
  //       ...prev,
  //       ...collectRequiredForTypeParameterDecl(param, scopeStacks)
  //     };
  //   }, {});
  // }
  // if (decl.type.types) {
  //   required = decl.type.types.reduce((prev, type) => {
  //     return {
  //       ...prev,
  //       ...collectRequiredForIdentifierOrExpr(type.typeName, TYPE_TYPE)
  //     };
  //   }, {});
  // }
  // if (ts.isTypeReferenceNode(decl.type)) {
  //   required = {
  //     ...required,
  //     ...collectRequiredForIdentifierOrExpr(decl.type.typeName, TYPE_TYPE)
  //   };
  // }
  // return required;
}

function checkCurrentScope(scope, required) {
  const res = Object.keys(required).reduce((prev, variable) => {
    const requiredType = required[variable];
    const scopeType = scope[variable];
    if (!((requiredType & scopeType) ^ requiredType)) {
      return prev;
    }
    if (requiredType & THIS_TYPE && scope.this) {
      const type = (requiredType ^ THIS_TYPE) & requiredType;
      return type
        ? {
            ...prev,
            [variable]: type
          }
        : {
            ...prev
          };
    }
    return {
      ...prev,
      [variable]: (requiredType ^ scopeType) & requiredType
    };
  }, {});
  return res;
}

function collectRequiredForDecl(decl, scopeStacks) {
  let required = {};
  if (ts.isFunctionDeclaration(decl)) {
    scopeStacks[scopeStacks.length - 1][decl.name.escapedText] = FUNC_TYPE | VARIABLE_TYPE;
    required = {
      ...required,
      ...collectRequiredForFunctionDecl(decl, scopeStacks)
    };
  }
  if (ts.isClassDeclaration(decl)) {
    scopeStacks[scopeStacks.length - 1][decl.name.escapedText] = CLASS_TYPE | TYPE_TYPE | VARIABLE_TYPE;
    required = {
      ...required,
      ...collectRequiredForClassDecl(decl, scopeStacks)
    };
  }
  if (ts.isMethodDeclaration(decl)) {
    scopeStacks[scopeStacks.length - 1][decl.name.escapedText] = VARIABLE_TYPE;
    required = {
      ...required,
      ...collectRequiredForMethodDecl(decl, scopeStacks)
    };
  }
  if (ts.isPropertyDeclaration(decl)) {
    scopeStacks[scopeStacks.length - 1][decl.name.escapedText] = VARIABLE_TYPE;
    required = {
      ...required,
      ...collectRequiredForPropertyDecl(decl, scopeStacks)
    };
  }
  if (ts.isInterfaceDeclaration(decl)) {
    scopeStacks[scopeStacks.length - 1][decl.name.escapedText] = VARIABLE_TYPE | TYPE_TYPE | INTERFACE_TYPE;
    required = {
      ...required,
      ...collectRequiredForInterfaceDecl(decl, scopeStacks)
    };
  }
  if (ts.isEnumDeclaration(decl)) {
    scopeStacks[scopeStacks.length - 1][decl.name.escapedText] = VARIABLE_TYPE;
    required = {
      ...required,
      ...collectRequiredForEnumDecl(decl, scopeStacks)
    };
  }
  if (ts.isTypeAliasDeclaration(decl)) {
    scopeStacks[scopeStacks.length - 1][decl.name.escapedText] = TYPE_TYPE;
    required = {
      ...required,
      ...collectRequiredForTypeAliasDecl(decl, scopeStacks)
    };
  }
  if (scopeStacks.length === 1) {
    scopeStacks[0][GLOBAL_REQUIRED_KEY][decl.name.escapedText] = required;
  }
  return required;
}

// TODO:
// 1. import
// 2. export
// 3. [ASP] module
// [ASP] namespace

function isDeclarationStatementKind(node) {
  const kind = node.kind;
  return (
    kind === ts.SyntaxKind.FunctionDeclaration ||
    kind === ts.SyntaxKind.MissingDeclaration ||
    kind === ts.SyntaxKind.ClassDeclaration ||
    kind === ts.SyntaxKind.InterfaceDeclaration ||
    kind === ts.SyntaxKind.TypeAliasDeclaration ||
    kind === ts.SyntaxKind.EnumDeclaration ||
    kind === ts.SyntaxKind.ModuleDeclaration ||
    kind === ts.SyntaxKind.ImportDeclaration ||
    kind === ts.SyntaxKind.ImportEqualsDeclaration ||
    kind === ts.SyntaxKind.ExportDeclaration ||
    kind === ts.SyntaxKind.ExportAssignment ||
    kind === ts.SyntaxKind.NamespaceExportDeclaration
  );
}

// TODO: what is notemitted, endofdecl, mergedecl?
function isStatementKindButNotDeclarationKind(node) {
  const kind = node.kind;
  return (
    kind === ts.SyntaxKind.BreakStatement ||
    kind === ts.SyntaxKind.ContinueStatement ||
    kind === ts.SyntaxKind.DebuggerStatement ||
    kind === ts.SyntaxKind.DoStatement ||
    kind === ts.SyntaxKind.ExpressionStatement ||
    kind === ts.SyntaxKind.EmptyStatement ||
    kind === ts.SyntaxKind.ForInStatement ||
    kind === ts.SyntaxKind.ForOfStatement ||
    kind === ts.SyntaxKind.ForStatement ||
    kind === ts.SyntaxKind.IfStatement ||
    kind === ts.SyntaxKind.LabeledStatement ||
    kind === ts.SyntaxKind.ReturnStatement ||
    kind === ts.SyntaxKind.SwitchStatement ||
    kind === ts.SyntaxKind.ThrowStatement ||
    kind === ts.SyntaxKind.TryStatement ||
    kind === ts.SyntaxKind.VariableStatement ||
    kind === ts.SyntaxKind.WhileStatement ||
    kind === ts.SyntaxKind.WithStatement ||
    kind === ts.SyntaxKind.NotEmittedStatement ||
    kind === ts.SyntaxKind.EndOfDeclarationMarker ||
    kind === ts.SyntaxKind.MergeDeclarationMarker
  );
}

function isReexport(node) {
  if (!ts.isExportDeclaration(node) || !node.moduleSpecifier) return false;
  return true;
}

function isLocalExportDecl(node) {
  return !isReexport(node) && ts.isExportDeclaration(node);
}

function isExportStatement(node) {
  if (!node.modifiers || !node.modifiers.length) return false;
  for (let modifier of node.modifiers) {
    if (modifier.kind === ts.SyntaxKind.ExportKeyword) {
      return true;
    }
  }
  return false;
}

function collectRequiredFromAST(node, scopeStacks) {
  if (isDeclarationStatementKind(node)) {
    collectRequiredForDecl(node, scopeStacks);
  } else if (isStatementKindButNotDeclarationKind(node)) {
    collectRequiredForStmt(node, scopeStacks);
  }
}

function collectRequiredRecursively(nodeName, requiredMap) {
  if (!requiredMap[nodeName]) {
    return {};
  }
  return {
    ...requiredMap[nodeName],
    ...Object.keys(requiredMap[nodeName]).reduce((prev, key) => {
      return {
        ...prev,
        ...collectRequiredRecursively(key, requiredMap)
      };
    }, {})
  };
}

function collectRequiredStartFromExports(node, requiredMap) {
  if (node.name) {
    return collectRequiredRecursively(node.name.escapedText, requiredMap);
  } else {
    return node.declarationList.declarations.reduce((prev, decl) => {
      return {
        ...prev,
        ...collectRequiredRecursively(decl.name.escapedText, requiredMap)
      };
    }, {});
  }
}

function filterDeclList(decls, requiredMap) {
  return decls.find(decl => requiredMap[decl.name.escapedText]);
}

function filterNode(node, requiredMap) {
  if (requiredMap[node.name.escapedText] <= VARIABLE_TYPE) {
    return node;
  }
  return null;
}

function checkIfRemainDeclStat(node, requiredMap) {
  return node.declarationList.declarations.find(decl => {
    return requiredMap[decl.name.escapedText] <= VARIABLE_TYPE;
  });
}

function parseSourceFile(sourceFile, context) {
  const globalScope = { [GLOBAL_REQUIRED_KEY]: {} };
  ts.visitEachChild(
    sourceFile,
    child => {
      collectRequiredFromAST(child, [globalScope]);
    },
    context
  );
  console.log(globalScope[GLOBAL_REQUIRED_KEY]);
  let required = {};
  ts.visitEachChild(
    sourceFile,
    child => {
      if (isLocalExportDecl(child) || ts.isExportDeclaration(child) || isExportStatement(child)) {
        required = {
          ...required,
          ...collectRequiredStartFromExports(child, globalScope[GLOBAL_REQUIRED_KEY])
        };
        if (child.name) {
          required[child.name.escapedText] = VARIABLE_TYPE;
        } else if (ts.isVariableStatement(child)) {
          child.declarationList.declarations.forEach(decl => {
            required[decl.name.escapedText] = VARIABLE_TYPE;
          });
        }
      }
    },
    context
  );
  return required;
}

function shakingTransformer() {
  return context => {
    const visit = (node, required) => {
      let r;
      if (ts.isSourceFile(node)) {
        r = parseSourceFile(node, context);
      }
      if ((required && isDeclarationStatementKind(node)) || ts.isVariableDeclaration(node)) {
        return filterNode(node, required);
      }
      if (required && ts.isVariableStatement(node)) {
        remain = checkIfRemainDeclStat(node, required);
        if (!remain) return null;
      }
      return ts.visitEachChild(node, child => visit(child, r || required), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

const program = ts.createProgram(srcFiles, compileOptions);
program.emit(undefined, undefined, undefined, undefined, {
  before: [shakingTransformer()]
});
