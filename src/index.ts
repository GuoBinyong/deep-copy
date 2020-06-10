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
    startDepth?:number;
}





function deepCopy<V,Key,Host>(value:V,typeCopyers?:TypeRevivers<Copier>|null,maxDepth?:number,options:CopyOptions<Key,Host> = {}):V {


    if (maxDepth == undefined){
        maxDepth = Infinity;
    }

    const startDepth = options.startDepth;
    const depth = startDepth == null ? 0 : startDepth;

    /**
     * 这里 用的是 maxDepth < depth 而不是 maxDepth <= depth ，原因如下：
     * 当 maxDepth === depth 时，当前的 value 还是需要被拷贝的，所以还是要生成 value 的副本，如果直接返回 value ，则是没有拷贝 value
     */
    if (maxDepth < depth || isBaseType(value)){
        return value;
    }


    const {key,host} = options;
    const nextDepth = depth + 1;

    function copyMember<T,K,H>(member:T,key?:K,host:H|V = value,memberDepth?:number):T {
        const memDepth = memberDepth == null ? nextDepth : memberDepth;
        return deepCopy(member,typeCopyers,maxDepth,{startDepth:memDepth,key,host});
    }

    const typeName = getExactTypeNameOf(value);

    if (typeCopyers){
        const trObj = toTypeReviverObject(typeCopyers);
        const copier:Copier = trObj[typeName];
        if (typeof copier === "function"){
            return  copier.call(host,value,copyMember,key,host,typeName,depth);
        }
    }


    if (typeof (<any>value).getCopy === "function"){
        return (<any>value).getCopy(copyMember,key,host,typeName,depth);
    }

    if (typeof (<any>value)[Symbol.iterator] === "function"){
        const valCopy = [];
        let index = 0;
        // @ts-ignore
        for (const item of value){
            const itemCopy = deepCopy(item,typeCopyers,maxDepth,{key:index,host:value,startDepth:nextDepth});
            valCopy.push(itemCopy);
            ++index;
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
        let propVal = (<any>value)[key];
        obj[key] = deepCopy(propVal,typeCopyers,maxDepth,{key,host:value,startDepth:nextDepth});
        return obj;
    },valCopy);

}
