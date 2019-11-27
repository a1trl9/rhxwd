const fs = require("fs");
const path = require("path");

function readResource(basePath, fileType = "ts") {
  if (!fs.statSync(basePath).isDirectory()) {
    return basePath.endsWith(fileType) ? [basePath] : [];
  }
  function _walk(p) {
    let files = [];
    fs.readdirSync(p).forEach(f => {
      const fullPath = path.resolve(p, f);
      if (fs.statSync(fullPath).isDirectory()) {
        files = [...files, ..._walk(fullPath)];
      } else {
        if (!f.endsWith(fileType)) return;
        files.push(fullPath);
      }
    });
    return files;
  }
  const files = _walk(basePath);
  return files;
}

module.exports = {
  readResource
};
