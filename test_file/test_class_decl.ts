class BaseClass {}
class BaseClass2 {}
class BaseClass3 extends BaseClass2 {}

const global_var_1 = 3;
const global_var_2 = 3;
const global_var_3 = 0;

class TestClass<T extends BaseClass2 = BaseClass3> extends BaseClass {
  private index = global_var_3;
  private local_var_1 = [{ a: 3 }];
  checkbox(local_var_2 = global_var_2) {
    return global_var_1 + 3 + this.local_var_1[this.index].a + local_var_2;
  }
}
