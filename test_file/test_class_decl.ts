class BaseClass {}
class BaseClass2 {}
class BaseClass3 extends BaseClass2 {}

class TestClass<T extends BaseClass2 = BaseClass3> extends BaseClass {}
