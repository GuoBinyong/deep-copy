import type {TypeRevivers,TypeReviverObject,TypeReviverMap} from "type-reviver"
import {toTypeReviverObject,mergeTypeRevivers} from "type-reviver"
import {isBaseType,getExactTypeNameOf} from "type-tls"
import type {OptionalBoolean} from "type-tls"
import type {Copier, CopyMemberOptions} from "./public"
import {presetTypeCopierArray} from "./copiers"




/**
 * deepCopy 函数的配置选项
 */
export interface DeepCopyOptions {
    maxDepth?:number|null|undefined;     // 可选；默认值为：Infinity；拷贝的最大深度；当值为 undefined 或 null 时，会使用默认值，表示无限深度；
    allOwnProps?:OptionalBoolean;    // 可选；默认值:undefined; 是否要拷贝所有自身的属性，包不可枚举的，但不包括原型链上的属性
    copyFun?:OptionalBoolean;  // 可选；默认值：false; 是否要对函数进行深拷贝； true：会对函数进行深拷贝；false：不会对函数进行深拷贝操作，只是引用原来的函数；
}



export interface DeepCopy {
    /**
     * 深拷贝
     * @param value
     * @param typeCopyers
     * @param maxDepth ? : number|null|undefined   可选；默认值为：Infinity；拷贝的最大深度；当值为 undefined 或 null 时，会使用默认值，表示无限深度；
     * @param allOwnProperties?: OptionalBoolean   可选；默认值：false; true：拷贝对象自身（不包括原型上的）的所有属性（包括不可枚举的）； false : 只拷贝对象自身中（不包括原型上的）可枚举的属性
     */
    <V>(value:V,typeCopyers?:TypeRevivers<Copier>|null|undefined,options?:DeepCopyOptions):V;
    presetTypeCopierMap: TypeReviverMap<Copier>;
}




/**
 * 默认 Copier 的 TypeName
 */
export const typeNameOfDefaultCopier = "default";



/**
 * 深拷贝的核心函数
 * @param value
 * @param typeReviverObject
 * @param maxDepth
 * @param startDepth
 * @param rawCopyMap:Map<any,any>    用于保存 被拷贝的对象 和 其对应的 副本 的 Map
 * @param allOwnProperties?: OptionalBoolean    可选；默认值:undefined; 是否要拷贝所有自身的属性，包不可枚举的，但不包括原型链上的属性
 * @param copyFun?: OptionalBoolean    可选；默认值：false; 是否要对函数进行深拷贝； true：会对函数进行深拷贝；false：不会对函数进行深拷贝操作，只是引用原来的函数；
 * @param key
 * @param host
 *
 * # 说明
 * rawCopyMap 可使被拷贝的对象 中 若存在 不在同一条属性链上的 多个属性 引用 同一对象时，拷贝后的副本仍然也保持 这种引用关系；
 * 但仍然不能还原 在同一条属性链上的多个属性的循环引用关系 以及 该种循环引用导致的调用栈 溢出问题；这种问题我也有办法解决（通过点位值 和 延迟设置），但目前不打算实现，因为个人觉得意义不大；
 */
function deepCopyByRecursive<V,Key,Host>(value:V,typeReviverObject:TypeReviverObject<Copier>,allOwnProperties:boolean,copyFun:boolean,maxDepth:number,startDepth:number,rawCopyMap:Map<any,any>,key?:Key,host?:Host):V {

    /**
     * 这里 用的是 maxDepth < depth 而不是 maxDepth <= depth ，原因如下：
     * 当 maxDepth === depth 时，当前的 value 还是需要被拷贝的，所以还是要生成 value 的副本，如果直接返回 value ，则是没有拷贝 value
     */
    if (maxDepth < startDepth || (!copyFun && typeof value === "function") || isBaseType(value)){
        return value;
    }

    const tarCopy = rawCopyMap.get(value);
    if (tarCopy){
        return tarCopy;
    }

    const nextDepth = startDepth + 1;

    function copyMember<T,K,H>(member:T,key?:K,host?:H|V,options?:CopyMemberOptions):T {
        const finalHost = host == null ? value : host;
        if  (options){
            var {allOwnProps,depth,copyFun:copyFunction} = options
        }
        const allOwnProps_Bool = allOwnProps == null ? allOwnProperties : allOwnProps;
        const copyFun_Bool = copyFunction == null ? copyFun : copyFunction;
        const memDepth = depth == null ? nextDepth : depth;
        return deepCopyByRecursive(member,typeReviverObject,allOwnProps_Bool,copyFun_Bool,maxDepth,memDepth,rawCopyMap,key,finalHost);
    }


    const typeName = getExactTypeNameOf(value);
    const copier:Copier = typeReviverObject[typeName];
    if (typeof copier === "function"){
        const itemCopy = copier.call(value,value,copyMember,{allOwnProps:allOwnProperties,key:key,host:host,type:typeName,depth:startDepth,copyFun:copyFun});
        rawCopyMap.set(value,itemCopy);
        return  itemCopy;
    }

    if (typeof (<any>value).getCopy === "function"){
        const itemCopy = (<any>value).getCopy(value,copyMember,{allOwnProps:allOwnProperties,key:key,host:host,type:typeName,depth:startDepth,copyFun:copyFun})
        rawCopyMap.set(value,itemCopy);
        return itemCopy;
    }


    const defaultTypeName = typeNameOfDefaultCopier;
    const defaultCopier:Copier = typeReviverObject[defaultTypeName];
    if (typeof defaultCopier === "function"){
        const itemCopy = defaultCopier.call(value,value,copyMember,{allOwnProps:allOwnProperties,key:key,host:host,type:defaultTypeName,depth:startDepth,copyFun:copyFun});
        rawCopyMap.set(value,itemCopy);
        return  itemCopy;
    }


    if (typeof (<any>value)[Symbol.iterator] === "function"){
        const valCopy = [];
        let index = 0;
        // @ts-ignore
        for (const item of value){
            const itemCopy = deepCopyByRecursive(item,typeReviverObject,allOwnProperties,copyFun,maxDepth,nextDepth,rawCopyMap,index,value);
            valCopy.push(itemCopy);
            rawCopyMap.set(value,itemCopy);
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
        valCopy = Object.create(Object.getPrototypeOf(value));
    }


    if (allOwnProperties){
        var allKeys = Object.getOwnPropertyNames(value);
    }else {
        allKeys = Object.keys(value);
    }



    return  allKeys.reduce(function (obj,key) {
        const propVal = (<any>value)[key];
        const itemCopy = deepCopyByRecursive(propVal,typeReviverObject,allOwnProperties,copyFun,maxDepth,nextDepth,rawCopyMap,key,value);
        const propDes = Object.getOwnPropertyDescriptor(value,key);
        Object.defineProperty(obj,key,propDes as PropertyDescriptor);
        obj[key] = itemCopy
        rawCopyMap.set(propVal,itemCopy);
        return obj;
    },valCopy);

}




export function createDeepCopy(presetTypeCopierMap?:TypeReviverMap<Copier>):DeepCopy {

    function deepCopy<V,Key,Host>(value:V,typeCopyers?:TypeRevivers<Copier>|null|undefined,options?:DeepCopyOptions):V {

        if (options){
            var {maxDepth,allOwnProps,copyFun} = options
        }

        const maxDepth_Num = maxDepth == null ? Infinity : maxDepth;
        const allOwnProps_Bool = !!allOwnProps;
        const copyFun_Bool = !!copyFun;


        const presetTCMap = deepCopy.presetTypeCopierMap;
        const mergedTCArr = mergeTypeRevivers(presetTCMap.size > 0 ? presetTCMap : null,typeCopyers);
        const trObj = toTypeReviverObject(mergedTCArr);
        return deepCopyByRecursive(value,trObj,allOwnProps_Bool,copyFun_Bool,maxDepth_Num,0,new Map());
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
