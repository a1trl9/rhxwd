// assuming we dont wanna side-effect module...
const global_var_1 = [{a: 3}];
const global_var_2 = 3, global_var_3 = 4;
const index = 0;

const if_var_1 = 3;
const for_var_1 = 3;
const for_var_2 = 3;
const for_var_3 = 3;
const for_var_4 = 3;

const default_var = 7

const array_el_1 = 4;
const array_el_2 = 4;
const global_array = [1, 2, 3, array_el_1];

const global_class_member_var_1 = 2;

const class_member = 3;
const global_var_4 = 5;

class ExportClass {
  private class_member = global_class_member_var_1;

  class_method_1() {
    return this.class_member;
  }
}

export function export_func_with_this_context() {
  const exportClass = new ExportClass();
  return this.global_var_4 + exportClass.class_method_1();
}


function local_func(param) {
  if (param > if_var_1) {
    return param;
  } else if (param < 100) {
    for (var for_var_1 = 0; for_var_1 < for_var_2; for_var_1++) {
      local_func_2(for_var_1 + for_var_3)
    }
    local_func_2(for_var_1)
  } else {
    for (let for_var_4 = 0; for_var_4 < for_var_2; for_var_4++) {
      local_func_2(for_var_4 + for_var_3)
    }
    local_func_2(for_var_4)
  }
  function local_func_2(param) { return param * 3}
}

function local_func_2(param = default_var) {
  label: {
    for (const k of global_array) {
      if (k > 2) break label;
    }
  }
  return param * 3;
}

export function export_func_1() {
  local_func(3);
  return global_var_1[index].a + global_var_3;
}
