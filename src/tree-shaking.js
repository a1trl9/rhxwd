const path = require("path");
const ts = require("typescript");

const BLOCK_FLAG = Symbol("block");
const FUNC_DECL_FLAG = Symbol("func_decl");

const VARIABLE_TYPE = 1 << 0;
const LABEL_TYPE = 1 << 1;

function buildFilePath(file) {
  return path.resolve(__dirname, file);
}

const srcFiles = [
  // statement
  buildFilePath("../test_file/test_do_statement.ts"),
  buildFilePath("../test_file/test_if_statement.ts"),
  buildFilePath("../test_file/test_while_statement.ts"),
  buildFilePath("../test_file/test_label_statement.ts"),
  buildFilePath("../test_file/test_for_statement.ts"),
  buildFilePath("../test_file/test_forof_statement.ts"),
  buildFilePath("../test_file/test_forin_statement.ts"),
  buildFilePath("../test_file/test_switch_statement.ts"),
  buildFilePath("../test_file/test_try_catch_statement.ts"),
  buildFilePath("../test_file/test_throw_statement.ts"),
  // declaration
  buildFilePath("../test_file/test_class_decl.ts")
];
const outDir = path.resolve(__dirname, "../dist");

const compileOptions = {
  outDir,
  sourceMap: false,
  declaration: false,
  emitDecoratorMetadata: true,
  experimentalDecorators: true,
  allowJs: true,
  moduleResolution: ts.ModuleResolutionKind.node,
  target: ts.ScriptTarget.ES5,
  removeComments: true,
  lib: ["es2017", "es2016", "es2015", "dom"]
};

// expression

function parseExpression(expr) {
  if (!expr || ts.isLiteralExpression(expr)) {
    return [];
  }
  if (ts.isArrayLiteralExpression(expr)) {
    return expr.elements.reduce((prev, el) => {
      return [...prev, ...parseIdentifierOrExpression(el)];
    }, []);
  }
  if (ts.isObjectLiteralExpression(expr)) {
    return expr.properties.reduce((prev, prop) => {
      return [
        ...prev,
        ...(ts.isComputedPropertyName(prop.name)
          ? parseIdentifierOrExpression(prop.name.expression)
          : []),
        ...parseIdentifierOrExpression(prop.initializer)
      ];
    }, []);
  }
  if (ts.isPropertyAccessExpression(expr)) {
    return parseIdentifierOrExpression(expr.expression);
  }
  if (ts.isElementAccessExpression(expr)) {
    return [
      ...parseIdentifierOrExpression(expr.expression),
      ...parseIdentifierOrExpression(expr.argumentExpression)
    ];
  }
  if (ts.isCallExpression(expr)) {
    let result = parseIdentifierOrExpression(expr.expression);
    result = expr.arguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrExpression(arg)];
    }, result);
    if (!expr.typeArguments) {
      return result;
    }
    return expr.typeArguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrExpression(arg.typeName)];
    }, result);
  }
  if (ts.isNewExpression(expr)) {
    const result = [
      ...parseIdentifierOrExpression(expr.expression),
      ...expr.arguments.reduce((prev, arg) => {
        return [...prev, ...parseIdentifierOrExpression(arg)];
      }, [])
    ];
    if (!expr.typeArguments) {
      return result;
    }
    return expr.typeArguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrExpression(arg.typeName)];
    }, result);
  }
  if (ts.isTaggedTemplateExpression(expr)) {
    const result = [
      ...parseIdentifierOrExpression(expr.tag),
      ...parseIdentifierOrExpression(expr.template)
    ];
    if (!expr.typeArguments) {
      return result;
    }
    return expr.typeArguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrExpression(arg.typeName)];
    }, result);
  }
  // TODO: TypeAssertionExpression
  if (ts.isTypeAssertion(expr)) {
    return [
      ...parseIdentifierOrExpression(expr.type.typeName),
      ...parseIdentifierOrExpression(expr.expression)
    ];
  }
  if (ts.isParenthesizedExpression(expr)) {
    return parseIdentifierOrExpression(expr.expression);
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
    return parseIdentifierOrExpression(expr.expression);
  }
  if (ts.isTypeOfExpression(expr)) {
    return parseIdentifierOrExpression(expr.expression);
  }
  if (ts.isVoidExpression(expr)) {
    return parseIdentifierOrExpression(expr.expression);
  }
  if (ts.isAwaitExpression(expr)) {
    return parseIdentifierOrExpression(expr.expression);
  }
  if (ts.isPrefixUnaryExpression(expr)) {
    return parseIdentifierOrExpression(expr.operand);
  }
  if (ts.isPostfixUnaryExpression(expr)) {
    return parseIdentifierOrExpression(expr.operand);
  }
  if (ts.isBinaryExpression(expr)) {
    return [
      ...parseIdentifierOrExpression(expr.left),
      ...parseIdentifierOrExpression(expr.right)
    ];
  }
  if (ts.isConditionalExpression(expr)) {
    return [
      ...parseIdentifierOrExpression(expr.condition),
      ...parseIdentifierOrExpression(expr.whenTrue),
      ...parseIdentifierOrExpression(expr.whenFalse)
    ];
  }
  if (ts.isTemplateExpression(expr)) {
    return expr.templateSpans.reduce((prev, span) => {
      return [...prev, ...parseIdentifierOrExpression(span.expression)];
    }, []);
  }
  if (ts.isYieldExpression(expr)) {
    return parseIdentifierOrExpression(expr.expression);
  }
  if (ts.isSpreadElement(expr)) {
    return parseIdentifierOrExpression(expr.expression);
  }
  if (ts.isClassExpression(expr)) {
    // TODO: parse class
    return [];
  }
  if (ts.isOmittedExpression(expr)) {
    return [];
  }
  if (ts.isExpressionWithTypeArguments(expr)) {
    const result = parseIdentifierOrExpression(expr.expression);
    if (!expr.typeArguments) {
      return result;
    }
    return expr.typeArguments.reduce((prev, arg) => {
      return [...prev, ...parseIdentifierOrExpression(arg.typeName)];
    }, result);
  }
  if (ts.isAsExpression(expr)) {
    return [
      ...parseIdentifierOrExpression(expr.expression),
      ...parseIdentifierOrExpression(expr.type.typeName)
    ];
  }
  if (ts.isNonNullExpression(expr)) {
    return parseIdentifierOrExpression(expr.expression);
  }
  if (ts.isMetaProperty(expr)) {
    return [];
  }
}

function parseIdentifierOrExpression(node) {
  if (ts.isIdentifier(node)) {
    return [node.escapedText];
  }
  return parseExpression(node);
}

function collectRequiredForIdentifierOrExpr(expr, type = VARIABLE_TYPE) {
  if (!expr) return {};
  const transformed = {};
  const required = parseIdentifierOrExpression(expr);
  required.forEach(varr => {
    transformed[varr] = (transformed[varr] || 0) | type;
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
    return collectRequiredForVariableDeclList(
      stmt.declarationList,
      scopeStacks
    );
  }
  if (ts.isExpressionStatement(stmt)) {
    return collectRequiredForIdentifierOrExpr(stmt.expression);
  }
  if (ts.isIfStatement(stmt)) {
    return {
      ...collectRequiredForIdentifierOrExpr(stmt.expression),
      ...collectRequiredForStmt(stmt.thenStatement, scopeStacks),
      ...(stmt.elseStatement
        ? collectRequiredForStmt(stmt.elseStatement, scopeStacks)
        : {})
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
    console.log(
      "Warning: we do not support tree-shake for WithStatement. Also it is not a recommended pattern."
    );
    return {
      ...parseIdentifierOrExpression(stmt.expression),
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
        ...collectRequiredForVariableDecl(
          stmt.catchClause.variableDeclaration,
          scopeStacks,
          true
        ),
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
  const localStack = scopeStacks[scopeStacks.length - 1];
  const required = checkCurrentScope(
    localStack,
    collectRequiredForIdentifierOrExpr(decl.initializer)
  );
  if (blockScoped) {
    localStack[decl.name.escapedText] = VARIABLE_TYPE;
  } else {
    let index = scopeStacks.length - 1;
    while (index >= 0 && scopeStacks[index][BLOCK_FLAG]) {
      index -= 1;
    }
    scopeStacks[index][decl.name.escapedText] = VARIABLE_TYPE;
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
  scopeStacks.push(functionScope);
  decl.parameters.forEach(param => {
    functionScope[param.name.escapedText] = VARIABLE_TYPE;
  });
  const required = decl.body.statements.reduce((prev, stmt) => {
    return {
      ...prev,
      ...collectRequiredForStmt(stmt, scopeStacks)
    };
  }, {});
  const checked = checkCurrentScope(functionScope, required);
  // leave function scope
  scopeStacks.pop();
  return checked;
}

function collectRequiredForTypeParameterDecl(decl, scopeStacks) {
  let required = {};
  if (decl.constraint) {
    required = {
      ...required,
      ...collectRequiredForIdentifierOrExpr(decl.constraint.typeName)
    };
  }
  if (decl.default) {
    required = {
      ...required,
      ...collectRequiredForIdentifierOrExpr(decl.default.typeName)
    };
  }
  return required;
}

function collectRequiredForClassDecl(decl, scopeStacks) {
  let required = {};
  if (decl.typeParameters && decl.typeParameters.length) {
    required = decl.typeParameters.reduce((prev, param) => {
      return {
        ...prev,
        ...collectRequiredForTypeParameterDecl(param, scopeStacks)
      };
    }, {});
  }
  return required;
}

function checkCurrentScope(scope, required) {
  return Object.keys(required).reduce((prev, variable) => {
    const requiredType = required[variable];
    const scopeType = scope[variable];
    if (!((requiredType & scopeType) ^ requiredType)) {
      return prev;
    }
    return {
      ...prev,
      [variable]: (requiredType ^ scopeType) & requiredType
    };
  }, {});
}

function parseSourceFile(sourceFile, context) {
  const globalScope = {};
  let required = {};
  ts.visitEachChild(
    sourceFile,
    child => {
      if (ts.isFunctionDeclaration(child)) {
        globalScope[child.name.escapedText] = true;
        required = {
          ...required,
          ...collectRequiredForFunctionDecl(child, [globalScope])
        };
      }
      if (ts.isClassDeclaration(child)) {
        globalScope[child.name.escapedText] = true;
        required = {
          ...required,
          ...collectRequiredForClassDecl(child, [globalScope])
        };
      }
    },
    context
  );
  console.log(required);
}

function shakingTransformer() {
  return context => {
    const visit = node => {
      if (ts.isSourceFile(node)) {
        parseSourceFile(node, context);
        return node;
      }
      return ts.visitEachChild(node, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

const program = ts.createProgram(srcFiles, compileOptions);
program.emit(undefined, undefined, undefined, undefined, {
  before: [shakingTransformer()]
});
