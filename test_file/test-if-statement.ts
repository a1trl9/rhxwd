// if statement
// - expression
// - thenStatement
// - elseStatement

let global_for_if_1 = 2;
let global_for_if_2 = 3;
let global_for_if_3 = 3;
let global_for_if_4 = 3;
let global_for_if_5 = 3;
const not_used_global_1 = 7;
const not_used_global_2 = 7;


// this variable shouldn't be included since the variable with same name declared in else-if is
// with var -> no block scope
let var_for_if = 3;
const const_for_if = 4;

let global_for_if_6 = 3;
let global_for_if_7 = 3;
let global_for_if_8 = 3;
let global_for_if_9 = 3;
let global_for_if_10 = 3;
let global_for_if_11 = 3;

export function if_else_block() {
  // if-else with block
  if (global_for_if_1 > 3) {
    const result = global_for_if_3 * 2;
    return result;
  } else if (global_for_if_2 < 6) {
    const result = global_for_if_4 + global_for_if_5;
    var var_for_if = 3;
    const const_for_if = 3;
    return result + var_for_if+ + const_for_if;
  } else {
    return global_for_if_6 + const_for_if;
  }
}

export function if_else_no_block() {
  // if-else without block
  if (global_for_if_7 > 10) return global_for_if_8 + 2
  else if (global_for_if_9 < 100) return global_for_if_10 + 3;
  else return global_for_if_11 + 3;
}