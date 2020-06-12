import {TypeRevivers,TypeReviverObject,toTypeReviverObject,TypeReviverMap,mergeTypeRevivers} from "type-reviver"
import {isBaseType,getExactTypeNameOf} from "type-tls"
import {Copier，OnlyEnumerated} from "./public"
import {presetTypeCopierArray} from "./copiers"






export interface DeepCopy {
    <V>(value:V,typeCopyers?:TypeRevivers<Copier>|null,maxDepth?:number,onlyEnumerated?:OnlyEnumerated):V;
    presetTypeCopierMap: TypeReviverMap<Copier>;
}




/**
 * 深拷贝的核心函数
 * @param value
 * @param typeReviverObject
 * @param maxDepth
 * @param startDepth
 * @param rawCopyMap:Map<any,any>    用于保存 被拷贝的对象 和 其对应的 副本 的 Map
 * @param key
 * @param host
 *
 * # 说明
 * rawCopyMap 可使被拷贝的对象 中 若存在 不在同一条属性链上的 多个属性 引用 同一对象时，拷贝后的副本仍然也保持 这种引用关系；
 * 但仍然不能还原 在同一条属性链上的多个属性的循环引用关系 以及 该种循环引用导致的调用栈 溢出问题；这种问题我也有办法解决（通过点位值 和 延迟设置），但目前不打算实现，因为个人觉得意义不大；
 */
function deepCopyByRecursive<V,Key,Host>(value:V,typeReviverObject:TypeReviverObject<Copier>,maxDepth:number,startDepth:number,rawCopyMap:Map<any,any>,onlyEnumerated?:OnlyEnumerated,key?:Key,host?:Host):V {

    /**
     * 这里 用的是 maxDepth < depth 而不是 maxDepth <= depth ，原因如下：
     * 当 maxDepth === depth 时，当前的 value 还是需要被拷贝的，所以还是要生成 value 的副本，如果直接返回 value ，则是没有拷贝 value
     */
    if (maxDepth < startDepth || isBaseType(value)){
        return value;
    }

    const tarCopy = rawCopyMap.get(value);
    if (tarCopy){
        return tarCopy;
    }


    const nextDepth = startDepth + 1;

    function copyMember<T,K,H>(member:T,key?:K,onlyEnum?:OnlyEnumerated,host:H|V = value,memberDepth?:number):T {
        onlyEnum = onlyEnum == null ? onlyEnumerated : onlyEnum;
        const memDepth = memberDepth == null ? nextDepth : memberDepth;
        return deepCopyByRecursive(member,typeReviverObject,maxDepth,memDepth,rawCopyMap,onlyEnum,key,host);
    }


    const typeName = getExactTypeNameOf(value);

    const copier:Copier = typeReviverObject[typeName];
    if (typeof copier === "function"){
        const itemCopy = copier.call(value,value,copyMember,onlyEnumerated,key,host,typeName,startDepth);
        rawCopyMap.set(value,itemCopy);
        return  itemCopy;
    }

    if (typeof (<any>value).getCopy === "function"){
        const itemCopy = (<any>value).getCopy(value,copyMember,onlyEnumerated,key,host,typeName,startDepth)
        rawCopyMap.set(value,itemCopy);
        return itemCopy;
    }

    if (typeof (<any>value)[Symbol.iterator] === "function"){
        const valCopy = [];
        let index = 0;
        // @ts-ignore
        for (const item of value){
            const itemCopy = deepCopyByRecursive(item,typeReviverObject,maxDepth,nextDepth,rawCopyMap,onlyEnumerated,index,value);
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
        valCopy = Object.create(null)
    }


    if (onlyEnumerated){
        var allKeys = Object.keys(value);
    }else {
        allKeys = Object.getOwnPropertyNames(value);
    }



    return  allKeys.reduce(function (obj,key) {
        const propVal = (<any>value)[key];
        const itemCopy = deepCopyByRecursive(propVal,typeReviverObject,maxDepth,nextDepth,rawCopyMap,onlyEnumerated,key,value);
        const propDes = Object.getOwnPropertyDescriptor(value,key);
        Object.defineProperty(obj,key,propDes as PropertyDescriptor);
        obj[key] = itemCopy
        rawCopyMap.set(propVal,itemCopy);
        return obj;
    },valCopy);

}





export function createDeepCopy(presetTypeCopierMap?:TypeReviverMap<Copier>):DeepCopy {

    function deepCopy<V,Key,Host>(value:V,typeCopyers?:TypeRevivers<Copier>|null,maxDepth?:number,onlyEnumerated?:OnlyEnumerated):V {

        if (maxDepth == undefined){
            maxDepth = Infinity;
        }

        const presetTCMap = deepCopy.presetTypeCopierMap;
        const mergedTCArr = mergeTypeRevivers(presetTCMap.size > 0 ? presetTCMap : null,typeCopyers);
        const trObj = toTypeReviverObject(mergedTCArr);
        return deepCopyByRecursive(value,trObj,maxDepth,0,new Map(),onlyEnumerated);
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
