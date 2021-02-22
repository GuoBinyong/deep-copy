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




root.sub = member1;
member1.sub = member2;
member2.sub = root;

debugger
let rootCopy = DC.deepCopy(root,null,{copyFun:true});

console.log(root.sub.sub.sub === root)
console.log(rootCopy.sub.sub.sub === rootCopy)
console.log(root.sub.fun === rootCopy.sub.fun)
