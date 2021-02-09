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


let copy1 = DC.deepCopy(root);
let copy2 = null;
DC.deepCopy(root,function (copy) {
    copy2 = copy
    debugger
});


debugger