// do statement
const global_for_do_1 = 4;
const global_for_do_2 = 4;

function testDo() {
  let local_for_do_1 = 3;
  let local_for_do_2 = 3;
  do {
    local_for_do_2 = global_for_do_1 + local_for_do_1;
  } while (local_for_do_2 + global_for_do_2 < 100);
}
