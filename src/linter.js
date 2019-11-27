const ts = require("typescript");
const fs = require("fs");
const readResource = require("./utils").readResource;
const fuzzy = require("./fuzzy");

function collectClass(node, classMap, sourceFile) {
  try {
    if (
      ts.isVariableDeclaration(node) &&
      node.name &&
      node.name.escapedText === "constants"
    ) {
      checkJsDoc(sourceFile);
    }
  } catch (e) {}
  // we only care named class so far
  if (ts.isClassDeclaration(node) && node.name) {
    const name = node.name.escapedText;
    classMap[name] = {
      node: node,
      sourceFile: sourceFile
    };
  }
  ts.forEachChild(node, function(c) {
    collectClass(c, classMap, sourceFile);
  });
}

function collectParents(node, classMap) {
  const nodeName = node.name.escapedText;
  if (classMap[nodeName] && classMap[nodeName].parents) {
    // hit cache
    return classMap[nodeName].parents;
  }
  let parents = [];
  if (node.heritageClauses && node.heritageClauses.length) {
    if (node.name.escapedText === "MoqiTableListMixinBase") {
      node.heritageClauses.forEach(heritage => {
        heritage.types.forEach(type => {
          console.log(type);
        });
      });
    }
    node.heritageClauses.forEach(heritage => {
      // we do not care about implement...
      if (heritage.token === ts.SyntaxKind.ImplementsKeyword) {
        return;
      }
      heritage.types.forEach(parent => {
        if (parent && parent.expression && parent.expression.kind) {
          const parentName = parent.expression.escapedText;
          // base class is not in the project.. so far we cannot do anything...
          if (!classMap[parentName]) {
            return;
          }
          const parentNode = classMap[parentName].node;
          parents.push({
            parentName: parentName,
            abstractMethods: extractAbstractMethods(parentNode.members)
          });
          parents = parents.concat(collectParents(parentNode, classMap));
        }
      });
    });
  }
  return parents;
}

function checkIfAbstract(member) {
  let isAbstract = false;
  if (!ts.isMethodDeclaration(member)) {
    return isAbstract;
  }
  if (
    member.jsDoc &&
    member.jsDoc.length &&
    member.jsDoc[0].tags &&
    member.jsDoc[0].tags.length
  ) {
    member.jsDoc[0].tags.forEach(tag => {
      if (tag && tag.tagName && tag.tagName.escapedText === "abstract") {
        isAbstract = true;
      }
    });
  }
  return isAbstract;
}

// not used yet
function checkIfNotEmpty(method) {
  return (
    method.body &&
    method.body.statements &&
    method.body.statements.pos !== method.body.statements.end
  );
}

function extractAbstractMethods(members) {
  const abstractMethods = [];
  members.forEach(function(member) {
    if (checkIfAbstract(member)) {
      abstractMethods.push(member);
    }
  });
  return abstractMethods;
}

function report(sourceFile, node, message) {
  const reset = "\x1b[0m";
  const fgRed = "\x1b[31m";
  // here could be buggy
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.name.end - node.name.escapedText.length
  );
  console.log(
    `${fgRed}${sourceFile.fileName} (${line + 1},${character +
      1}): ${message}${reset}`
  );
}

const classMap = {};
let initialized = false;
const testDir =
  "/Users/a1trl9/workspace/fingerprint-frontend/frontend-v3/src/app";

function buildSourceFiles(files) {
  return files.map(f => {
    return ts.createSourceFile(
      f,
      fs.readFileSync(f).toString(),
      ts.ScriptTarget.ES5
    );
  });
}

function buildMap(fileName) {
  let sourceFiles;
  if (fileName === undefined) {
    // const files = readResource(
    //   testDir
    //   // "."
    // );
    // const program = ts.createProgram(files, {
    //   target: ts.ScriptTarget.ES5,
    //   module: ts.ModuleKind.CommonJS
    // });
    sourceFiles = buildSourceFiles(readResource(testDir));
  } else {
    sourceFiles = [
      ts.createSourceFile(
        fileName,
        fs.readFileSync(fileName).toString(),
        ts.ScriptTarget.ES5
      )
    ];
  }

  for (const sourceFile of sourceFiles) {
    if (!sourceFile.isDeclarationFile) {
      collectClass(sourceFile, classMap, sourceFile);
    }
  }
}

function lint() {
  if (!initialized) {
    buildMap();
    initialized = true;
  }

  Object.keys(classMap).forEach(name => {
    classMap[name].parents = collectParents(classMap[name].node, classMap);
  });

  const visited = {};
  let passed = true;
  const fgGreen = "\x1b[32m";
  const reset = "\x1b[0m";

  Object.keys(classMap).forEach(name => {
    const classNode = classMap[name].node;
    const methods = classNode.members;
    const methodNames = {};
    methods.forEach(method => {
      if (!method.name || !method.name.escapedText) {
        return;
      }
      const methodName = method.name.escapedText;
      methodNames[methodName] = true;
    });
    const methodNameArray = Object.keys(methodNames);
    const parents = classMap[name].parents;
    parents.forEach(parent => {
      const abstractMethods = parent.abstractMethods;
      abstractMethods.forEach(absMethod => {
        const methodName = absMethod.name.escapedText;
        if (!methodNames[methodName]) {
          const key = `${name}:${methodName}`;
          if (visited[key] !== undefined) {
            return;
          }
          const cands = methodNameArray.filter(name => {
            return fuzzy(name, methodName) < 3;
          });
          let message = `Method \`${methodName}\` in class \`${parent.parentName}\` should be implemented in \`${name}\``;
          if (cands.length) {
            message = `${message}.\nProbably you misspell following: \`${cands.join(
              " or "
            )}\`?`;
          }
          passed = false;
          report(classMap[parent.parentName].sourceFile, absMethod, message);
          visited[key] = true;
        }
      });
    });
  });
  if (passed) {
    console.log(`${fgGreen}All checks passed!${reset}`);
  }
}

// call
// const t1 = Date.now();
// lint();
// const t2 = Date.now();
// console.log(t2 - t1);

module.exports = {
  lint,
  buildMap
};
