/**
 * 当值为 null 或  undefined 时，表示使用默认值；
 */
export type AllOwnProperties = boolean | null | undefined ;

/**
 * 成员的深拷贝方法
 * @param member : any  改选；被拷贝的成员
 * @param key ?:any     可选；成员 member 对应的 key
 * @param allOwnProperties?:AllOwnProperties    可选；true：拷贝对象自身（不包括原型上的）的所有属性（包括不可枚举的）； false : 只拷贝对象自身中（不包括原型上的）可枚举的属性； null | undefined : 使用原来的设置（调用深拷贝deepCopy函数时的设置）； 默认值：使用原来的值；
 * @param host ?:any    可选；成员 member 所属的宿主对象；默认值：传给 copier 的 value ；
 * @param depth ?:number   可选；member 的深度值； 默认值：depth + 1，depth 是传给 copier 的 depth 参数值；成员
 */
export type CopyMember<T = any,K = any,H = any> = (member:T,key?:K,allOwnProperties?:AllOwnProperties,host?:H,depth?:number)=>T;

export type Copier<T = any,Host = any> = (this:T,value:T,copyMember:CopyMember,allOwnProperties:AllOwnProperties,key:any,host:Host,type:string,depth:number)=>T




export interface Copyable {
    getCopy:Copier<this>;
}

export function isCopyable(target:any):target is Copyable {
    return target && typeof target.getCopy === "function";
}
