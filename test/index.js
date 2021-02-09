const DC = require("../dist/deep-copy.cjs")

let root = {
    name:"root"
}

let obj2 = {
    name:"obj2",
    root:root,
    fun:function () {
        console.log("这是函数")
    }
}

let obj1 = {
    name:"obj1",
    sub:obj2
}

root.sub = obj1;

debugger
let copy1 = DC.deepCopy(root);


const isEq = root.sub.sub.root === root
const isEq1 = copy1.sub.sub.root === copy1
const isEq2 = copy1.sub.sub.fun === obj2.fun

debugger