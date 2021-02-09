import type {OptionalBoolean} from "type-tls"



export interface CopyMemberOptions {
    allOwnProps?:OptionalBoolean;    //当值为 null 或  undefined 时，表示使用之前设置的值；
    depth?:number|null|undefined;    // 可选；member 的深度值； 默认值：depth + 1，depth 是传给 copier 的 depth 参数值；成员
    copyFun?:OptionalBoolean      //当值为 null 或  undefined 时，表示使用之前设置的值；
}


/**
 * 拷贝完成的回调函数
 */
export type CompleteCB<V> = (copy:V)=>void;


/**
 * 成员的深拷贝方法
 * @param member : any  改选；被拷贝的成员
 * @param key ?:any     可选；成员 member 对应的 key
 * @param host ?:any | null | undefined   可选；成员 member 所属的宿主对象；默认值：传给 copier 的 value ；当值为 null | undefined 会使用传给 copier 的 value 作为 host
 * @param options?:CopyMemberOptions
 */
export type CopyMember<T = any,K = any,H = any> = (member:T,completeCB?:CompleteCB<T>,key?:K,host?:H | null | undefined,options?:CopyMemberOptions)=>T;


export interface CopierOptions<Host> {
    allOwnProps:OptionalBoolean;
    key:any;
    host:Host;
    type:string;
    depth:number;
    copyFun:boolean;
}


export type Copier<T = any,Host = any> = (this:T,value:T,copyMember:CopyMember,options:CopierOptions<Host>)=>T




export interface Copyable {
    getCopy:Copier<this>;
}

export function isCopyable(target:any):target is Copyable {
    return target && typeof target.getCopy === "function";
}
