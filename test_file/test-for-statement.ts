function testForStatement() {
  {
    for (var i = 2, j = 3; i < 10; i++) {
      const for_local_1 = i + j + var_local_1;
    }
  }
  for (let k = 2; k < 10; k++) console.log(k);
}
