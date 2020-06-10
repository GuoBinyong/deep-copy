
export type CopyMember<T = any,K = any,H = any> = (member:T,key?:K,host?:H,depth?:number)=>T;

export type Copier<T = any,Host = any> = (this:T,value:T,copyMember:CopyMember,key:any,host:Host,type:string,depth:number)=>T




export interface Copyable {
    getCopy:Copier<this>;
}

export function isCopyable(target:any):target is Copyable {
    return target && typeof target.getCopy === "function";
}



/*
考虑到安全和性能的原因，弃用 eval，改用 Function 的方式；
*/
export function copyFunction<F extends Function>(fun:F):F {
    const source = fun.toString();
    const name = fun.name;
    //判断函数代码是否是匿名函数
    let hasName = /function\s+[A-Za-z_$]+[\w$]*\s*\(/.test(source);

    if (!hasName && /^[A-Za-z_$]+[\w$]*$/.test(name)){ // 当 函数代码是匿名函数 且 name 是有效的标识符
        var funBody = `"use strict"; var ${name} = ${source} ; return ${name}`;
    }else {
        funBody = `"use strict"; return (${source})`;
    }
    return (new Function(funBody))();
}
