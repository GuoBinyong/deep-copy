
export type CopyMember<T = any,K = any,H = any> = (member:T,key?:K,host?:H,depth?:number)=>T;

export type Copier<T = any,Host = any> = (this:T,value:T,copyMember:CopyMember,key:any,host:Host,type:string,depth:number)=>T




export interface Copyable {
    getCopy:Copier<this>;
}

export function isCopyable(target:any):target is Copyable {
    return target && typeof target.getCopy === "function";
}