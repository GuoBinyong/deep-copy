import {Copier} from "./public"
import {TypeReviverArray} from "type-reviver"
import {copyFunction} from "com-tools"


// Date ----------


export const Date_Copier:Copier<Date> = function (value){
    return new Date(value.getTime());
}


// Array ----------

export const Array_Copier:Copier<Array<any>> = function (value,copyMember){
    return value.map(function (val, index) {
        return copyMember(val,index);
    });
}



// Map ----------

export const Map_Copier:Copier<Map<any,any>> = function (value,copyMember){
    const copy = new Map();
    value.forEach(function (value, key) {
        copy.set(key,copyMember(value,key));
    });
    return copy;
}







// Set ----------

const Set_Copier:Copier<Set<any>>  = function (value,copyMember){
    const copy = new Set();
    let index = 0;
    for (const item of value){
        copy.add(copyMember(item,index));
        ++index;
    }
    return copy;
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
    return copyFunction(value);
}







export const presetTypeCopierArray:TypeReviverArray<Copier> = [
    [Date,Date_Copier],
    [Array,Array_Copier],
    [Map,Map_Copier],
    [Set,Set_Copier],
    [URL,URL_Copier],
    [RegExp,RegExp_Copier],
    [Function,Function_Copier]
];


export default presetTypeCopierArray;
