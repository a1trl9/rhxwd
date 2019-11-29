const global_arr = [1, 2, 3];
const global_var_1 = 3;
const global_var_2 = 3;
function testForOfStatement() {
  const local_arr = [4, 5, 6];
  const local_var_1 = 4;
  for (const i of global_arr) {
    for (const j of local_arr) {
      console.log(i + j);
      console.log(global_var_1 - local_var_1);
    }
  }
  return 3 + global_var_2;
}
