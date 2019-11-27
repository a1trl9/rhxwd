"use strict";
let b = 2;
try {
  var a = 2;
} catch (e) {
  let b = 4;
  console.log("catch");
}
console.log(a, b);
