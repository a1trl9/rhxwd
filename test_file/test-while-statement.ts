// WhileStatement
// - expression: condition
// - statement: could be in block or not. We need to test the scope

let global_for_while_1 = 4;
let global_for_while_2 = 4;
let global_for_while_3 = 4;
let global_for_while_4 = 4;

// this variable shouldn't be included since the variable with same name declared in while loop is
// with var -> no block scope
const var_in_while_loop = 4;

// this variable should be included
const const_in_while_loop = 4;

// we also need to check if the block scope works correctly for var/const/let
export function while_test() {
  // while with block
  while (global_for_while_1 < 10) {
    const const_in_while_loop = 3;
    var var_in_while_loop = 4;
    global_for_while_2 += 1 + const_in_while_loop + global_for_while_2;
  }
  // while without block
  while (global_for_while_3 < 10) global_for_while_3 += global_for_while_4 + var_in_while_loop + const_in_while_loop;
}
