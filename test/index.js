const DC = require("../dist/deep-copy.cjs")


let root = {
    name:"root"
};

let member1 = {
    name:"member1",
    fun:function () {
        console.log("这是函数")
    }
};


let member2 = {
    name:"member2",
};




root.ref = member1;
member1.ref = member2;
member2.ref = root;

debugger
let rootCopy = DC.deepCopy(root,null,{copyFun:true});

console.log(root.ref.ref.ref === root)
console.log(rootCopy.ref.ref.ref === rootCopy)
console.log(root.ref.fun === rootCopy.ref.fun)
