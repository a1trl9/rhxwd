const global_obj = { 1: 1, 2: 2, 3: 3 };
const global_var_forof_1 = 3;

function testForInStatement() {
  const local_obj = { 4: 2, 5: 3, 6: 2 };
  const local_var_1 = 4;
  for (const i in global_obj) {
    for (const j in local_obj) {
      console.log(i + j);
      console.log(global_var_forof_1 - local_var_1);
    }
  }
}
