/**
 * 当值为 null 或  undefined 时，表示使用默认值；
 */
export type OnlyEnumerated = boolean | null | undefined ;

export type CopyMember<T = any,K = any,H = any> = (member:T,key?:K,onlyEnumerated?:OnlyEnumerated,host?:H,depth?:number)=>T;

export type Copier<T = any,Host = any> = (this:T,value:T,copyMember:CopyMember,onlyEnumerated:OnlyEnumerated,key:any,host:Host,type:string,depth:number)=>T




export interface Copyable {
    getCopy:Copier<this>;
}

export function isCopyable(target:any):target is Copyable {
    return target && typeof target.getCopy === "function";
}