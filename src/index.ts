import {TypeRevivers,toTypeReviverObject} from "type-reviver"
import {isBaseType,getExactTypeNameOf} from "type-tls"



type CopyMember<T = any,K = any,H = any> = (member:T,key?:K,host?:H,depth?:number)=>T;

type Copier<T = any,Host = any> = (this:Host,value:T,copyMember:CopyMember,key:any,host:Host,type:string,depth:number)=>T


interface Copyable {
    getCopy(copyMember:CopyMember,key:any,host:any,type:string,depth:number):this;
}

function isCopyable(target:any):target is Copyable {
    return target && typeof target.getCopy === "function";
}





interface CopyOptions<Key,Host> {
    key?:Key;
    host?:Host;
    depth?:number;
}


function deepCopy<V,Key,Host>(value:V,typeCopyers?:TypeRevivers<Copier>|null,options:CopyOptions<Key,Host> = {}):V {
    if (isBaseType(value)){
        return value;
    }

    let {key,host,depth} = options;
    depth = depth == null ? 0 : depth;

    let nextDepth = depth + 1;

    function copyMember<T,K,H>(member:T,key?:K,host?:H,memberDepth?:number):T {
        const memDepth = memberDepth == null ? nextDepth : memberDepth;
        return deepCopy(member,typeCopyers,{depth:memDepth,key,host});
    }

    const typeName = getExactTypeNameOf(value);

    if (typeCopyers){
        const trObj = toTypeReviverObject(typeCopyers);
        let copier:Copier = trObj[typeName];
        if (typeof copier === "function"){
            return  copier.call(host,value,copyMember,key,host,typeName,depth);
        }
    }


    if (typeof (<any>value).getCopy === "function"){
        return (<any>value).getCopy(copyMember,key,host,typeName,depth);
    }

    if (typeof (<any>value)[Symbol.iterator] === "function"){
        let valCopy = [];
        let index = 0;
        // @ts-ignore
        for (let item of value){
            const itemCopy = copyMember(item,index,value,nextDepth);
            valCopy.push(itemCopy);
        }

        return <any>valCopy;
    }



    const valConsr = (<any>value).constructor;
    let valCopy:any;
    if (typeof valConsr === "function"){
        try {
            valCopy = new valConsr();
        }catch (e) {
            valCopy = Object.create((<Function>valConsr).prototype)
        }
    }else {
        valCopy = Object.create(null)
    }

    const allKeys = Object.getOwnPropertyNames(value);

    return  allKeys.reduce(function (obj,key) {
        obj[key] = (<any>value)[key];
        return obj;
    },valCopy);

}
