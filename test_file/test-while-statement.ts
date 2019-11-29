// while statement
const global_for_while_1 = 4;
const global_for_while_2 = 4;

function testWhile(param1, param2) {
  let local_for_while_1 = 2;
  const local_for_while_2 = 4;
  while (local_for_while_1 > 2) {
    local_for_while_1 += global_for_while_1;
  }
  let local_for_while_3 = 3;
  while (local_for_while_3 > 8) local_for_while_3 += global_for_while_2;
}
