// export default a;

export const k = 7;
export function func() {}
export class cls {}
export enum en {}
export type ty = "1" | "2";
export interface int {}

const k2 = 8;
function func2() {
  return 3;
}
class cls2 {}
enum en2 {}
type ty2 = "1" | "2";
interface int2 {}

export { k2, func2, cls2, en2, ty2 as ty2_export, int2 as int_export };

// export default function func4() {}
const a = { b: { c: 3 } };
const arr = [2, 3];
export default arr[0].t[2].c["asds"];

export * from "./test-3-component";
