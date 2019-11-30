const global_var_for_try_1 = 3;
const global_var_for_catch_1 = '';
const global_var_for_final_1 = 4;

function func_in_try_block(param: number) {
  return param + 1;
}

function func_in_catch_block(param: string) {
  return param + '';
}

function func_in_finally_block(param: number) {
  return param * 2;
}

export function export_func() {
  try {
    func_in_try_block(global_var_for_try_1);
  } catch(e) {
    func_in_catch_block(global_var_for_catch_1);
  } finally {
    const local_var_in_final = 3;
    func_in_finally_block(local_var_in_final);
  }
}
