const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const readResource = require("./utils").readResource;

const testDir = "/Users/a1trl9/personal/tscp/test_file/test-component.ts";
// "/Users/a1trl9/workspace/fingerprint-frontend/frontend-v3/src/app/pages/shell/shell.component.ts";

const baseDir = "/Users/a1trl9/personal/tscp/test_file";
// "/Users/a1trl9/workspace/fingerprint-frontend/frontend-v3";

const fileNames = readResource(testDir);

const pkgMap = {};
fileNames.forEach(filename => {
  const sourceFile = createSourceFile(filename);
  collectDeps(sourceFile, filename, pkgMap, []);
});

fs.writeFileSync(
  path.resolve(__dirname, "../test_file/output.json"),
  JSON.stringify(pkgMap)
);

function collectDeps(sourceFile, filename, pkgMap, chains) {
  pkgMap[filename] = {
    imports: [],
    exports: {},
    variables: {}
  };
  const unresolvedExport = {};
  ts.forEachChild(sourceFile, node => {
    if (node.kind === ts.SyntaxKind.EndOfFileToken) {
      return;
    }
    let isImportOrExport = false;
    if (isDefaultExportAssignment(node)) {
      parseDefaultExportAssignment(node, pkgMap[filename], unresolvedExport);
      return;
    }
    if (ts.isExportAssignment(node)) {
      // TODO: add error console
      return;
    }

    // imports and exports
    if (ts.isImportDeclaration(node) || isReexport(node)) {
      isImportOrExport = true;
      let path;
      if ((path = node.moduleSpecifier) && (path = path.text)) {
        path = normalizeImportPath(path, baseDir, filename);
        if (!fs.existsSync(path)) {
          return;
        }
        if (!pkgMap[path]) {
          collectDeps(createSourceFile(path), path, pkgMap, [
            ...chains,
            filename
          ]);
        } else if (!pkgMap[path].sourceFile) {
          console.warn(
            `cycle deps: ${[...chains, filename, chains[0]].join(" -> ")}`
          );
          process.exit();
        }
        pkgMap[filename].imports.push(pkgMap[path]);
      }
      if (ts.isImportDeclaration(node)) {
        addImportToVariabls(
          node,
          pkgMap[filename],
          pkgMap[path],
          unresolvedExport
        );
      }
      if (isReexport(node)) {
        reexport(pkgMap[filename], pkgMap[path]);
      }
    }
    if (isLocalExportDecl(node)) {
      isImportOrExport = true;
      parseLocalExportDecl(node, pkgMap[filename], unresolvedExport);
    }
    if (isExportStatement(node)) {
      isImportOrExport = true;
      parseExportStatement(node, pkgMap[filename]);
    }
    if (isImportOrExport) {
      return;
    }

    // variable statement
    if (ts.isVariableStatement(node)) {
      parseVariableStatement(node, pkgMap[filename], unresolvedExport);
      return;
    }
    if (isNamedDeclaration(node)) {
      parseNamedDeclaration(node, pkgMap[filename], unresolvedExport);
      return;
    }
    if (!isImportOrExport && !node.name) {
      console.log(node);
    }
  });
  pkgMap[filename].sourceFile = sourceFile;
}

function reexport(target, importMap) {
  Object.keys(importMap.exports).forEach(exportName => {
    target.exports[exportName] = importMap.exports[exportName];
  });
}

function isDefaultExportStatement(node) {
  if (!node.modifiers) return false;
  let isDefault = false;
  node.modifiers.forEach(mod => {
    if (mod.kind === ts.SyntaxKind.DefaultKeyword) {
      isDefault = true;
    }
  });
  return isDefault;
}

function handUnresolvedExport(name, target, unresolvedExport) {
  if (unresolvedExport[name]) {
    target.exports[unresolvedExport[name]].mapVariable = target.variables[name];
  }
}

function addImportForImportAll(node, target, importTarget, unresolvedExport) {
  const name = node.name.escapedText;
  target.variables[name] = importTarget.exports;
  handUnresolvedExport(name, target, unresolvedExport);
}

function addImportForImportDefault(
  node,
  target,
  importTarget,
  unresolvedExport
) {
  const name = node.name.escapedText;
  if (!importTarget.exports.default) {
    console.log("default is not defined");
  }
  target.variables[name] = importTarget.exports.default;
  handUnresolvedExport(name, target, unresolvedExport);
}

function addImportToVariabls(node, target, importTarget, unresolvedExport) {
  const importClause = node.importClause;

  if (!importClause) {
    console.log("We do not wanna support side-effect import!!");
    console.log(node);
    process.exit();
  }

  // import default
  // @example: import something from './other.module';
  if (importClause.name) {
    addImportForImportDefault(
      importClause,
      target,
      importTarget,
      unresolvedExport
    );
  }

  const namedBindings = importClause.namedBindings;
  if (!namedBindings) {
    return;
  }

  // import all
  // @example: import * as something from './other.module';
  if (!namedBindings.elements) {
    addImportForImportAll(
      namedBindings,
      target,
      importTarget,
      unresolvedExport
    );
    return;
  }

  // normal import
  // @example1: import { a, b } from './other.module';
  // @example2: import { a as alias, b } from './other.module';
  const elements = namedBindings.elements;
  elements.forEach(el => {
    let localName;
    let importName;
    if (el.propertyName) {
      importName = el.propertyName.escapedText;
      localName = el.name.escapedText;
    } else {
      importName = el.name.escapedText;
      localName = importName;
    }
    if (!importTarget.exports[importName]) {
      console.log("Error! not found", importName);
    } else {
      target.variables[localName] = importTarget.exports[importName];
      handUnresolvedExport(localName, target, unresolvedExport);
    }
  });
}

function parseVariableStatement(node, target, unresolvedExport) {
  let decls = node.declarationList.declarations;
  decls.forEach(decl => {
    target.variables[decl.name.escapedText] = decl;
    handUnresolvedExport(decl.name.escapedText, target, unresolvedExport);
  });
}

function isNamedDeclaration(node) {
  return (
    ts.isClassDeclaration(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isTypeAliasDeclaration(node)
  );
}

function parseNamedDeclaration(node, target, unresolvedExport) {
  const name = node.name.escapedText;
  target.variables[name] = node;
  handUnresolvedExport(name, target, unresolvedExport);
}

/**
 * @example: export * from '../other.module'
 */
function isReexport(node) {
  if (!ts.isExportDeclaration(node) || !node.moduleSpecifier) return false;
  return true;
}

function parseLocalExportDecl(node, target, unresolvedExport) {
  let locals = node.exportClause;
  if (locals && (locals = locals.elements)) {
    locals.forEach(el => {
      let localName;
      let exportName;
      if (el.propertyName) {
        localName = el.propertyName.escapedText;
        exportName = el.name.escapedText;
      } else {
        localName = el.name.escapedText;
        exportName = localName;
      }
      target.exports[exportName] = { node: el, localName };
      if (target.variables[localName]) {
        target.exports[exportName].mapVariable = target.variables[localName];
      } else {
        unresolvedExport[localName] = exportName;
      }
    });
  }
}

function parseLocalnameForAccessExp(accessExps) {
  let localName = [];
  for (let index = accessExps.length - 1; index > -1; index--) {
    const exp = accessExps[index];
    if (!exp.type) {
      localName.push(exp.text);
    } else if (exp.type === "dotAccess") {
      localName.push(`.${exp.text}`);
    } else {
      localName.push(`[${exp.text}]`);
    }
  }
  return localName.join("");
}

function parseDefaultExportAssignment(node, target, unresolvedExport) {
  if (target.exports.default) {
    console.log("multiple default export!!");
    process.exit();
  }
  let expression = node.expression;
  let accessExps = [];
  while (expression && !expression.escapedText) {
    if (expression.name && expression.name.escapedText) {
      accessExps.push({ type: "dotAccess", text: expression.name.escapedText });
    }
    if (expression.argumentExpression) {
      accessExps.push({
        type: "arg",
        text: expression.argumentExpression.text
      });
    }
    expression = expression.expression;
  }
  if (expression) {
    accessExps.push({ text: expression.escapedText });
  }
  target.exports.default = {
    node
  };
  const name = accessExps.length
    ? accessExps[accessExps.length - 1]
    : "default";
  const accessToken = parseLocalnameForAccessExp(accessExps);
  target.exports.default = {
    localName: name,
    accessToken
  };
  if (target.variables[name]) {
    // dotAccessVisit(target.variables[name], dotAccess);
    target.exports.default.mapVariable = target.variables[name];
  } else {
    unresolvedExport[name] = "default";
  }
}

// function dotAccessVisit(variable, dotAccess) {
//   const times = dotAccess.length;
//   let node = variable;
//   for (let i = 0; i < times; i++) {
//     if (
//       !node ||
//       !node.name ||
//       node.name.escapedText !== dotAccess[times - 1 - i]
//     ) {
//       console.log(node);
//       process.exit();
//     }
//     console.log(i);
//     node = node.initializer;
//   }
// }

function isDefaultExportAssignment(node) {
  return ts.isExportAssignment(node);
}

/**
 * @example
 * const a = 2;
 * const b = 3;
 * export { a, b };
 */
function isLocalExportDecl(node) {
  return !isReexport(node) && ts.isExportDeclaration(node);
}

function parseExportStatement(node, target) {
  if (node.name) {
    let nodeName;
    if (isDefaultExportStatement(node)) {
      nodeName = "default";
    } else {
      nodeName = node.name.escapedText;
    }
    target.exports[nodeName] = {
      node,
      localName: node.name.escapedText,
      mapVariable: node
    };
    target.variables[node.name.escapedText] = node;
  } else {
    node.declarationList.declarations.forEach(decl => {
      target.exports[decl.name.escapedText] = {
        node: decl,
        localName: decl.name.escapedText,
        mapVariable: decl
      };
      target.variables[decl.name.escapedText] = decl;
    });
  }
}

/**
 *
 * @exmaple
 * export const a = 2
 * export function a() {}
 */
function isExportStatement(node) {
  if (!node.modifiers || !node.modifiers.length) return false;
  for (let modifier of node.modifiers) {
    if (modifier.kind === ts.SyntaxKind.ExportKeyword) {
      return true;
    }
  }
  return false;
}

function createSourceFile(filename) {
  return ts.createSourceFile(
    filename,
    fs.readFileSync(filename).toString(),
    ts.ScriptTarget.ES5
  );
}

function normalizeImportPath(p, basePath, filePath) {
  let normalized = path.resolve(basePath, p);
  if (isRelativePath(p)) {
    const fileDir = getFileDir(filePath);
    normalized = path.resolve(fileDir, p);
  }
  return normalized + ".ts";
}

function getFileDir(path) {
  const segs = path.split("/");
  segs.pop();
  return segs.join("/");
}

function isRelativePath(path) {
  return path.startsWith(".") || path.startsWith("..");
}
