
/*
(c) dbj.org
The absolute core of dbj cores ... perhaps we can call it dbj.core
*/
(function (undefined) {

    /*
    additions to ES5 intrinsics
    */
    /* moot point: what happens in the presence of another "".format() ? */
    if ("function" != typeof "".format)
        String.prototype.format = function () {
            var args = arguments;
            return this.replace(/\{(\d|\d\d)\}/g, function ($0) {
                var idx = 1 * $0.match(/\d+/)[0]; return args[idx] !== undefined ? args[idx] : (args[idx] === "" ? "" : $0);
            }
            );
        }

    var oprot = Object.prototype, aprot = Array.prototype, sprot = String.prototype;

    var /*implementation*/imp_ = {
        /* coercion to Int32 as required by asm.js */
        toInt32: function (v_) {
            return v_ | 0;
        },
        isEven: function (value) { return (imp_.toInt32(value) % 2 == 0); },
        /* dbj's type system */
        type: (function () {
            var rx = /\w+/g, tos = oprot.toString;
            return function (o) {
                if (typeof o === "undefined") return "undefined";
                if (o === null) return "null";
                if ("number" === typeof (o) && isNaN(o)) return "nan";
                return (tos.call(o).match(rx)[1]).toLowerCase();
            }
        }()),
        isObject: function (o) { return "object" === imp_.type(o); },
        isFunction: function (o) { return "function" === imp_.type(o); },
        isArray: function (o) { return "array" === imp_.type(o); },
        isString: function (o) { return "string" === imp_.type(o); }
    };

    dbj.core = {

        "toString": function () { return "dbj(); kernel 1.2.0"; },
        /* 
        coercion to Int32 
        also required by asm.js
        */
        "toInt32": imp_.toInt32,
        "isEven": imp_.isEven,

        "oprot": oprot,
        "aprot": aprot,
        "sprot": sprot,

        "type": imp_.type,
        "isObject": imp_.isObject,
        "isFunction": imp_.isFunction,
        "isArray": imp_.isArray,
        "isString": imp_.isString
    };

    // we do not export it to node from here
    /*
        if ('undefined' != typeof module ) module['exports'] = dbj ;
    */

}(
    function () {
        // for dom env this creates window.dbj
        // for node env this creates module local var
        if ("undefined" == typeof dbj)
            dbj = {};
        return dbj;
    }()
    ));

/*--------------------------------------------------------------------------------------------*/
/*
MIT (c) dbj 2013 -2018 
place for dbj comparators
dependancy: dbj.kernel (above) and ES5
NOTE: since 2013 quite a few comparators have been implemented please be sure which
comparator you need and use the ones bellow after that.
*/
/*--------------------------------------------------------------------------------------------*/
(function (dbj, undefined) {
    "use strict";

    // also defines what is a comparator : 
    function strict_eq(a, b) { return a === b; }
    // as per ES5 spec this returns false on different types


    /*
    multi_comparator  allows arrays v.s. singles to be compared 
    
    Examples:
    
    multi_comparator( 1, [3,2,1] ) --> true
    multi_comparator( [3,2,1], 1 ) --> true
    multi_comparator( function (){ return 1;}, [3,2,1] ) --> false
    multi_comparator( [3,2,1], ["x",[3,2,1]] ) --> true
    
    if some complex comparator is used then multi_comparator works for all types
    */
    var multi_comparator = function (a, b, comparator) {

    /*
    return index of an elelemnt found in the array
    (as customary) returns -1 , on not found
    use comparator function
    */
        var array_lookup = function (array, searched_element) {

            if (!Array.isArray(array)) array = [array]; 

        return array.findIndex(
            function (element) {
                return (comparator(element, searched_element));
            });
        };

        if (comparator(a, b)) return true;          /* covers arr to arr too */
        if (array_lookup(b, a ) > -1) return true;  /* single in arr */
        if (array_lookup(a, b ) > -1) return true;  /* arr to single */

        return false;
    };

    /*
    Two arrays are considered equal when all their elements 
    fulfill the following conditions:

    1.  types are equal
    2.  positions are equal
    3. values are equal

    Sparse arrays are also compared for equality

    this is the tough test, that has to be satisfied:

                 equal_arrays([1, 2, , 3], [1, 2, 3]); // => false
    
    function has(element, index) {
        return this[index] === element;
    }

    function equal_arrays(a, b) {
        return (a.length === b.length) && a.every(has, b) && b.every(has, a);
    }
    
    optimised version of the above, also using the comparator
    */
    function equal_arrays(a, b, comparator) {

        return (a.length === b.length) &&
            a.every(function (e, i) { return comparator(e, b[i]); }) &&
            b.every(function (e, i) { return comparator(e, a[i]); });
    }

    /* interface */
    dbj.compare = {
        'standard': strict_eq,
        /* 
        compare two arrays 
       if comparator is given uses it otherwise uses strict_eq().

       NOTE: this method is in here because it might prove faster than 
       dbj.compare.multi()
        */
        'arr': function (a, b, /* optional */ comparator) {

            if (!Array.isArray(a)) a = [a]; // throw TypeError("First argument must be array");
            if (!Array.isArray(b)) b = [b]; // throw TypeError("Second argument must be array");

            return equal_arrays(
                a, b, comparator || strict_eq
            )
        },
        /*
        Can compare two arrays AND single to array AND array to single value
        NOTE: if comparator is given use it otherwise use strict_eq().
        */
        'multi': function (a, b, comparator) {

            if (!!comparator && "function" != typeof comparator)
                throw TypeError("Third argument is given but is not a function");

            return multi_comparator(a, b, comparator || strict_eq);
        }
    };

    /*
    export to Node.JS
    (also works in the presence of qUnit "module")
    */
    if ("undefined" != typeof module) {
        module['exports'] = dbj;  // for node js usage
    }

}(function () {
    // for dom env this creates window.dbj
    // for node env this creates module local var
    if ("undefined" == typeof dbj)
        dbj = {};
    return dbj;
}()
    )
);

