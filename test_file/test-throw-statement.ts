const global_var_1 = 2;
export function testThrowStatement() {
  const local_var_1 = 3;
  throw global_var_1 + local_var_1;
}
