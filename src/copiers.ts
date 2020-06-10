import {CopyMember,copyFunction,Copier} from "./TypeDef"
import {TypeReviverArray} from "type-reviver"


/*

declare global {
    interface Date {
        getCopy(value:this,copyMember:CopyMember,key:any,host:any,type:string,depth:number):this;
    }

    interface Map<K, V> {
        getCopy(value:this,copyMember:CopyMember,key:any,host:any,type:string,depth:number):this;
    }

    interface Set<T> {
        getCopy(value:this,copyMember:CopyMember,key:any,host:any,type:string,depth:number):this;
    }

    interface URL {
        getCopy(value:this,copyMember:CopyMember,key:any,host:any,type:string,depth:number):this;
    }

    interface RegExp {
        getCopy(value:this,copyMember:CopyMember,key:any,host:any,type:string,depth:number):this;
    }

    interface Function {
        getCopy(value:this,copyMember:CopyMember,key:any,host:any,type:string,depth:number):this;
    }
}
*/


// Date ----------


export const Date_Copier:Copier<Date> = function (value,copyMember){
    return new Date(value.getTime());
}



// Map ----------

export const Map_Copier:Copier<Map<any,any>> = function (value,copyMember){
    const copy = new Map();
    value.forEach(function (value, key, map) {
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

export const URL_Copier:Copier<URL> = function (value,copyMember){
    return new URL(value.href);
}





// RegExp ----------

export const RegExp_Copier:Copier<RegExp> = function (value,copyMember){
    return new RegExp(value);
}




// Function ----------

export const Function_Copier:Copier<Function> = function (value,copyMember){
    return copyFunction(value);
}




export const presetTypeCopierArray:TypeReviverArray<Copier> = [
    [Date,Date_Copier],
    [Map,Map_Copier],
    [Set,Set_Copier],
    [URL,URL_Copier],
    [RegExp,RegExp_Copier],
    [Function,Function_Copier]
];


export default presetTypeCopierArray;
