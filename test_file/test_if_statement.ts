// if statement
const global_for_if_1 = 2;
let global_for_if_2 = 3;
let global_for_if_3 = 4;
let global_for_if_4 = 4;
let global_for_if_5 = 6;
let global_for_if_6 = 6;

const global_for_func_2 = 3;

function testIf(param1, param2) {
  if (param1 > global_for_if_1) {
    const if_local_1 = param2 + global_for_if_1;
  } else if (param2 === global_for_if_1) {
    const if_local_1 = global_for_if_3 * 4;
  } else {
    const global_for_if_2 = 3;
    const if_local_1 = param1 + global_for_if_2;
  }
  const if_local_2 = 3;
  const if_local_3 = 4;
  if (param2 > global_for_func_2) console.log(global_for_if_4);
  else if (param2 === global_for_func_2)
    console.log(global_for_if_5 + if_local_2);
  else console.log(global_for_if_6 + if_local_3);
}
