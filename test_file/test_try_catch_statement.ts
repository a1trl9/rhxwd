const global_var_1 = 3;
const global_var_2 = 3;
const global_var_3 = 3;
const global_var_4 = 3;
export function testTryCatchStatement() {
  const local_var_1 = 2;
  const local_var_2 = 2;
  const local_var_3 = 4;
  try {
    const a = local_var_1 + global_var_1;
    const local_var_3 = 4;
  } catch (e) {
    const b = global_var_2 + local_var_2 + global_var_3 + e;
    var b_var = 4;
  } finally {
    const c = global_var_4 + local_var_3;
  }
  const d = b_var;
}
