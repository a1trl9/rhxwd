const tokenTypes = require('./type').tokenTypes;
const buildNode = require('./util').buildNode;

class ExpressionParser {
  createNode() {
    return {};
  }

  parseAtomicExpression(inputToken) {
    if (inputToken.type === tokenTypes.slash) {
      return this.parseRegularExpression();
    }
  }

  parseRegularExpression() {}

  parseIdentifier() {
    const node = this.createNode();
  }
}
