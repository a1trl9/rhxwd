function fuzzy(s, t) {
  const insert = 1;
  const mismatch = 1;
  const remove = 1;
  const match = 0;
  const rows = t.length + 1;
  const cols = s.length + 1;
  const dp = Array(rows);
  const isDistance = match < mismatch ? 1 : 0;
  let d1;
  let d2;
  let d3;
  dp.forEach(d => {
    d = Array(cols);
  });
  for (let i = 0; i < rows; i++) {
    dp[i * cols] = i * insert;
  }
  for (let i = 0; i < cols; i++) {
    dp[i] = i * remove;
  }

  for (let j = 1; j < rows; j++) {
    for (let k = 1; k < cols; k++) {
      d3 =
        s[k - 1] === t[j - 1]
          ? dp[(j - 1) * cols + k - 1] + match
          : dp[(j - 1) * cols + k - 1] + mismatch;
      d1 = dp[j * cols + k - 1] + remove;
      d2 = dp[(j - 1) * cols + k] + insert;
      if (isDistance) {
        dp[j * cols + k] = Math.min(d3, Math.min(d1, d2));
      } else {
        dp[j * cols + k] = Math.max(d3, Math.max(d1, d2));
      }
    }
  }
  return dp[rows * cols - 1];
}

module.exports = fuzzy;
