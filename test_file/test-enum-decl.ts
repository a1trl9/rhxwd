const global_enum_var_1 = 3;
const not_used_global_var = 4;

function global_enum_func(): number { return 3 }

export enum Test {
  t = global_enum_var_1,
  b = global_enum_func()
}
