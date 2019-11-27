// global variables
const global_for_func_1 = 1;
let global_for_func_2 = 1;
var var_local_1 = 1;

// function declaration
function funcDecl1(param1, param2) {
  // variable statement
  // const local_1 = param1 + global_for_func_1;
  // const global_for_func_2 = 3;
  // const local_2 = param2 + global_for_func_2;
  // block scope
  // {
  //   var var_local_1 = 3;
  //   let let_local_1 = 3;
  //   const const_local_1 = 3;
  // }
  // const const_local_2 = var_local_1;
  // for statement in a nested block
  // {
  //   for (var i = 2, j = 3; i < 10; i++) {
  //     const for_local_1 = i + j + var_local_1;
  //   }
  // }
  // if statement
  // expected:
  // global_for_if_1
  // global_for_if_3
  // global_for_func_2
  // global_for_if_4
  // global_for_if_5
  // global_for_if_6
  // while statement
  // expected:
  // global_for_while_1
  // global_for_while_2
  // do statement
  // expected:
  // global_for_do_2
  // global_for_do_1
}
