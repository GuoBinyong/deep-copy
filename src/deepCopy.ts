import type {TypeRevivers,TypeReviverObject,TypeReviverMap} from "type-reviver"
import {toTypeReviverObject,mergeTypeRevivers} from "type-reviver"
import {isBaseType,getExactTypeNameOf} from "type-tls"
import type {OptionalBoolean} from "type-tls"
import type {Copier,Copyable, CopyMemberOptions,CompleteCB} from "./public"
import {presetTypeCopierArray} from "./copiers"
import {Decide} from "com-tools"




/**
 * deepCopy 函数的配置选项
 */
export interface DeepCopyOptions {
    maxDepth?:number|null|undefined;     // 可选；默认值为：Infinity；拷贝的最大深度；当值为 undefined 或 null 时，会使用默认值，表示无限深度；被拷贝的值本身的深度为 0 ，被拷贝值的成员的深度为 1 ，依次类推；
    allOwnProps?:OptionalBoolean;    // 可选；默认值:undefined; 是否要拷贝所有自身的属性，包不可枚举的，但不包括原型链上的属性；true：拷贝对象自身（不包括原型上的）的所有属性（包括不可枚举的）； false : 只拷贝对象自身中（不包括原型上的）可枚举的属性
    copyFun?:OptionalBoolean;  // 可选；默认值：false; 是否要对函数进行深拷贝； true：会对函数进行深拷贝；false：不会对函数进行深拷贝操作，只是引用原来的函数；
}



export interface DeepCopy {
    /**
     * 深拷贝
     * @param value
     */
    <V>(value:V,options?:DeepCopyOptions|null|undefined,typeCopyers?:TypeRevivers<Copier>|null|undefined):V;

    /**
     * 预设的 TypeCopierMap
     */
    presetTypeCopierMap: TypeReviverMap<Copier>;
}



/**
 * 默认 Copier 的 TypeName
 */
export const typeNameOfDefaultCopier = "default";




/**
 * deepCopyByRecursive 的参数类型
 */
interface DeepCopyByRecursiveOptions<V,Key,Host>{
    value:V;
    typeReviverObject:TypeReviverObject<Copier>;
    // 是否要拷贝所有自身的属性，包不可枚举的，但不包括原型链上的属性；true：拷贝对象自身（不包括原型上的）的所有属性（包括不可枚举的）； false : 只拷贝对象自身中（不包括原型上的）可枚举的属性
    allOwnProps:boolean;
    // 是否要对函数进行深拷贝； true：会对函数进行深拷贝；false：不会对函数进行深拷贝操作，只是引用原来的函数；
    copyFun:boolean;
    // 默认值为：Infinity；拷贝的最大深度；当值为 undefined 或 null 时，会使用默认值，表示无限深度；
    maxDepth:number;
    startDepth:number;
    //用于保存 被拷贝的对象 和 其对应的 副本 的 Map
    rawCopyMap:Map<any,Decide>;
    completeCB?:CompleteCB<V>|null|undefined;
    key?:Key;
    host?:Host;
}

/**
 * 深拷贝的核心函数
 */
function deepCopyByRecursive<V,Key,Host>(options:DeepCopyByRecursiveOptions<V,Key,Host>):V|undefined {
    const {value,typeReviverObject,allOwnProps:allOwnProperties,copyFun,maxDepth,startDepth,rawCopyMap,completeCB:complete,key,host} = options;
    const completeCB = complete || function () {};
    /**
     * 这里 用的是 maxDepth < depth 而不是 maxDepth <= depth ，原因如下：
     * 当 maxDepth === depth 时，当前的 value 还是需要被拷贝的，所以还是要生成 value 的副本，如果直接返回 value ，则是没有拷贝 value
     */
    if (maxDepth < startDepth || (!copyFun && typeof value === "function") || isBaseType(value)){
        completeCB(value);
        return value;
    }

    let decide = rawCopyMap.get(value);
    if (decide){
        decide.then(completeCB);
        return decide.value
    }
    decide = new Decide<V>();
    decide.then(completeCB);
    rawCopyMap.set(value,decide);

    const nextDepth = startDepth + 1;

    function copyMember<T,K,H>(member:T,compCB?:CompleteCB<T>|null|undefined,key?:K,host?:H|V,options?:CopyMemberOptions) {
        const finalHost = host == null ? value : host;
        if  (options){
            var {allOwnProps,depth,copyFun:copyFunction} = options
        }
        const allOwnProps_Bool = allOwnProps == null ? allOwnProperties : allOwnProps;
        const copyFun_Bool = copyFunction == null ? copyFun : copyFunction;
        const memDepth = depth == null ? nextDepth : depth;
        return deepCopyByRecursive({value:member,typeReviverObject,allOwnProps:allOwnProps_Bool,copyFun:copyFun_Bool,maxDepth,startDepth:memDepth,rawCopyMap,completeCB:compCB,key,host:finalHost});
    }


    const typeName = getExactTypeNameOf(value);
    const copier:Copier = typeReviverObject[typeName];
    if (typeof copier === "function"){
        const valCopy = copier.call(value,value,copyMember,{allOwnProps:allOwnProperties,key:key,host:host,type:typeName,depth:startDepth,copyFun:copyFun});
        decide.value = valCopy;
        return  valCopy;
    }

    if (typeof (<Copyable><unknown>value).getCopy === "function"){
        const valCopy = (<any>value).getCopy(value,copyMember,{allOwnProps:allOwnProperties,key:key,host:host,type:typeName,depth:startDepth,copyFun:copyFun})
        decide.value = valCopy;
        return valCopy;
    }


    const defaultTypeName = typeNameOfDefaultCopier;
    const defaultCopier:Copier = typeReviverObject[defaultTypeName];
    if (typeof defaultCopier === "function"){
        const valCopy = defaultCopier.call(value,value,copyMember,{allOwnProps:allOwnProperties,key:key,host:host,type:defaultTypeName,depth:startDepth,copyFun:copyFun});
        decide.value = valCopy;
        return  valCopy;
    }


    if (typeof (<any>value)[Symbol.iterator] === "function"){
        const valCopy:any[] = [];
        let index = 0;
        // @ts-ignore
        for (const item of value){
            const itemIndex = index;
            /**
             * 因为接下来要往通过 splice 往 valCopy 中插入元素，必须要保证当插入元素时 valCopy 的长度一定要包含被插入元素的开始位置;
             * 否则，splice 会从元素末尾插入元素，这样有可能会打乱 itemCopy 的原始顺序
             */
            valCopy.push(undefined);
            deepCopyByRecursive({
                value:item,typeReviverObject,allOwnProps:allOwnProperties,copyFun,maxDepth,startDepth:nextDepth,rawCopyMap,
                completeCB:function (itemCopy) {
                    valCopy.splice(itemIndex,1,itemCopy);
                },
                key:index,host:value
            });
            ++index;
        }

        decide.value = valCopy;
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
        valCopy = Object.create(Object.getPrototypeOf(value));
    }


    if (allOwnProperties){
        var allKeys = Object.getOwnPropertyNames(value);
    }else {
        allKeys = Object.keys(value);
    }


    for (const key of allKeys){
        const propVal = (<any>value)[key];
        deepCopyByRecursive({
            value:propVal,typeReviverObject,allOwnProps:allOwnProperties,copyFun,maxDepth,startDepth:nextDepth,rawCopyMap,
            completeCB:function (itemCopy) {
               const propDes = Object.getOwnPropertyDescriptor(value,key);
               Object.defineProperty(valCopy,key,propDes as PropertyDescriptor);
               valCopy[key] = itemCopy;
            },
            key,
            host:value}
            );
    }

    decide.value = valCopy;
    return valCopy;
}



export function createDeepCopy(presetTypeCopierMap?:TypeReviverMap<Copier>|null|undefined):DeepCopy {

    function deepCopy<V>(value:V,options?:DeepCopyOptions|null|undefined,typeCopyers?:TypeRevivers<Copier>|null|undefined):V {

        if (options){
            var {maxDepth,allOwnProps,copyFun} = options
        }

        const maxDepth_Num = maxDepth == null ? Infinity : maxDepth;
        const allOwnProps_Bool = !!allOwnProps;
        const copyFun_Bool = !!copyFun;


        const presetTCMap = deepCopy.presetTypeCopierMap;
        const mergedTCArr = mergeTypeRevivers(presetTCMap.size > 0 ? presetTCMap : null,typeCopyers);
        const trObj = toTypeReviverObject(mergedTCArr);
        return deepCopyByRecursive({value,typeReviverObject:trObj,allOwnProps:allOwnProps_Bool,copyFun:copyFun_Bool,maxDepth:maxDepth_Num,startDepth:0,rawCopyMap:new Map()}) as V;
    }




    Object.defineProperty(deepCopy,"presetTypeCopierMap",{
        configurable:true,
        enumerable:true,
        get:function () {
            if (!this._presetTypeCopierMap){
                this._presetTypeCopierMap = new Map();
            }
            return this._presetTypeCopierMap;
        },
        set:function (newValue) {
            if (newValue instanceof Map){
                this._presetTypeCopierMap = newValue;
            }
        }
    });




    if (presetTypeCopierMap){
        deepCopy.presetTypeCopierMap = presetTypeCopierMap;
    }

    return deepCopy;

}


export const defaultPresetTypeCopierMap = new Map(presetTypeCopierArray);


export const deepCopy:DeepCopy = createDeepCopy(new Map(presetTypeCopierArray));
