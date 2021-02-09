import type {Copier} from "./public"
import type {TypeReviverArray} from "type-reviver"
import {copyConstructor} from "com-tools"


// Date ----------


export const Date_Copier:Copier<Date> = function (value){
    return new Date(value.getTime());
}


// Array ----------

export const Array_Copier:Copier<Array<any>> = function (value,copyMember){
    return value.reduce(function (valCopy,item, index) {
        valCopy.push(undefined);
        copyMember(item,function (itemCopy) {
            valCopy.splice(index,1,itemCopy);
        },index);

        return valCopy;
    },[]);

}



// Map ----------

export const Map_Copier:Copier<Map<any,any>> = function (value,copyMember){
    const valCopy = new Map();
    value.forEach(function (item, key) {
        copyMember(item,function (itemCopy) {
            valCopy.set(key,itemCopy);
        },key);
    });
    return valCopy;
}







// Set ----------

const Set_Copier:Copier<Set<any>>  = function (value,copyMember){
    const valCopy = new Set();
    let index = 0;
    for (const item of value){
        copyMember(item,function (itemCopy) {
            valCopy.add(itemCopy);
        },index);
        ++index;
    }
    return valCopy;
}




// URL ----------

export const URL_Copier:Copier<URL> = function (value){
    return new URL(value.href);
}





// RegExp ----------

export const RegExp_Copier:Copier<RegExp> = function (value){
    return new RegExp(value);
}




// Function ----------

export const Function_Copier:Copier<Function> = function (value){
    return copyConstructor(value);
}







export const presetTypeCopierArray:TypeReviverArray<Copier> = [
    [Date,Date_Copier],
    [Array,Array_Copier],
    [Map,Map_Copier],
    [Set,Set_Copier],
    [URL,URL_Copier],
    [RegExp,RegExp_Copier],
    [Function,Function_Copier],
    ["AsyncFunction",Function_Copier],
    ["GeneratorFunction",Function_Copier]
];


export default presetTypeCopierArray;
