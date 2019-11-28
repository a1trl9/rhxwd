const global_var_1 = 3;
const global_var_2 = 3;
const index = 0;
export function test(a = global_var_1) {
  const global_var_2 = [{ a: 3 }];
  return this.global_var_2[index].a;
}
