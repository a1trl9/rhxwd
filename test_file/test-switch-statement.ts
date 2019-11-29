let global_var_1 = 2;
let global_var_2 = 3;
let global_var_3 = 4;
let global_var_4 = 4;

export function testSwitchStatement() {
  const local_var_1 = 3;
  const local_var_2 = 4;
  const local_var_3 = 4;
  const local_var_4 = 4;
  switch (global_var_1 + local_var_1) {
    case local_var_2:
      a = 3;
      console.log(local_var_4);
      break;
    case global_var_2:
      break;
    case global_var_3: {
      const b = 2;
    }
    case global_var_4:
      console.log(b);
    default:
      let a = 2;
      console.log(local_var_3 + a);
  }
}
