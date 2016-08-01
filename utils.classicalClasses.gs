/* 
  Two utility functions that provide for classical classes in js, from http://speakingjs.com/es5/ch17.html
*/
function copyOwnPropertiesFrom(target, source) {
    Object.getOwnPropertyNames(source)  // (1)
    .forEach(function(propKey) {  // (2)
        var desc = Object.getOwnPropertyDescriptor(source, propKey); // (3)
        Object.defineProperty(target, propKey, desc);  // (4)
    });
    return target;
};
function subclasses(SubC, SuperC) {
    var subProto = Object.create(SuperC.prototype);
    copyOwnPropertiesFrom(subProto, SubC.prototype);
    SubC.prototype = subProto;
    SubC._super = SuperC.prototype;
};

