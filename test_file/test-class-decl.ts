class NotUsedBaseClass_1 {}
class NotUsedBaseClass_2 {}

// global variables required for typeParamters
// BaseClass1, BaseClass2 only used for typeParameters, which actually won't be compiled to JS, so
// should not be included.
class BaseClass1 {}
class BaseClass2 extends BaseClass1 {}

// BaseClass3 and BaseClass4 are used for typeParameters as well, while BaseClass4 is used for
// initializing class member, namely should be included, BaseClass3, as base class, should be included as well. 
class BaseClass3 {}
class BaseClass4 extends BaseClass3 {}

// global variables required for heritage clause
class BaseClass5 {}
// interface is skipped by TS compiler internally.. it is not a feature of JS...
interface BaseInterface1 {}

// global variables for class members
class BaseClass6 {}
const global_var_for_member_1 = 3;
const global_var_for_member_2 = 3;
const not_used_global_var_for_member = 0; 

/**
 * a class declaration may contain:
 * - Array<typeParameter>?
 * - Array<heritageClause>?
 * - members
 * TODO: handle decorator
 */
export class TestClass<T extends BaseClass1 = BaseClass2, K extends BaseClass3 = BaseClass4> extends BaseClass5 implements BaseInterface1  {
  private class_member_1 = new BaseClass6();
  private class_member_2 = new BaseClass4();
  private class_member_3 = (global_var_for_member_1 * global_var_for_member_2);

  member_method() {
    const variable_member_1 = this.class_member_1 as T; 
    const variable_member_2 = this.class_member_2 as K; 
    return [variable_member_1, variable_member_2];
  }

  constructor() {
    super()
  }
}
