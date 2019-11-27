/**
 * adapted from ofiicial example
 */

const fs = require("fs");
const ts = require("typescript");
const { buildMap, lint } = require("./linter");
const readResource = require("./utils").readResource;

function watch(rootFileNames, options) {
  const files = {};

  rootFileNames.forEach(fileName => {
    files[fileName] = { version: 0 };
  });

  // Create the language service host to allow the LS to communicate with the host
  const servicesHost = {
    getScriptFileNames: () => rootFileNames,
    getScriptVersion: fileName =>
      files[fileName] && files[fileName].version.toString(),
    getScriptSnapshot: fileName => {
      if (!fs.existsSync(fileName)) {
        return undefined;
      }
      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => options,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory
  };

  // Create the language service files
  const services = ts.createLanguageService(
    servicesHost,
    ts.createDocumentRegistry()
  );

  // Now let's watch the files
  console.log("Start watching!");
  lint();
  rootFileNames.forEach(fileName => {
    // First time around, emit all files

    // Add a watch on the file to handle next change
    fs.watchFile(
      fileName,
      { persistent: true, interval: 300 },
      (curr, prev) => {
        // Check timestamp
        if (+curr.mtime <= +prev.mtime) {
          return;
        }

        // Update the version to signal a change in the file
        files[fileName].version++;

        // write the changes to disk
        console.log(`${fileName} updated`);
        buildMap(fileName);
        lint();
      }
    );
  });

  // function emitFile(fileName) {
  //   let output = services.getEmitOutput(fileName);

  //   if (!output.emitSkipped) {
  //     console.log(`Emitting ${fileName}`);
  //   } else {
  //     console.log(`Emitting ${fileName} failed`);
  //     // logErrors(fileName);
  //   }

  //   // output.outputFiles.forEach(o => {
  //   //   fs.writeFileSync(o.name, o.text, "utf8");
  //   // });
  // }

  // function logErrors(fileName) {
  //   let allDiagnostics = services
  //     .getCompilerOptionsDiagnostics()
  //     .concat(services.getSyntacticDiagnostics(fileName))
  //     .concat(services.getSemanticDiagnostics(fileName));

  //   allDiagnostics.forEach(diagnostic => {
  //     let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  //     if (diagnostic.file) {
  //       let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
  //         diagnostic.start!
  //       );
  //       console.log(
  //         `  Error ${diagnostic.file.fileName} (${line + 1},${character +
  //           1}): ${message}`
  //       );
  //     } else {
  //       console.log(`  Error: ${message}`);
  //     }
  //   });
  // }
}

// Initialize files constituting the program as all .ts files in the current directory
const currentDirectoryFiles = readResource(
  "/Users/a1trl9/workspace/fingerprint-frontend/frontend-v3/src/app"
  // "."
);
// Start the watcher
watch(currentDirectoryFiles, { module: ts.ModuleKind.CommonJS });
