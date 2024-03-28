//-----------------------------------------------------------------------
// (c) 2017-18, Grinning Elephant
//-----------------------------------------------------------------------
"use strict";

let __tsLastReportedFunctionWarning = 0;

const getValue = (input,values = {}) => {
    // if there's a comma, use the part before the comma as the key
    let comma = input.indexOf(",");
    let key = (comma < 0) ? input : input.substr(0,comma);
    let value = values[key];
    if (value === undefined)  {
        value = ((0 <= comma) && input.substr(comma + 1)) || "";
    }
    return value;
};

class ContentMacros {
    constructor(config = {}) {
        if (config.values) {
            this.values = config.values;
            delete config.values
        } else {
            this.values = {};
        }
        this.config = Object.assign({
            functions: {},  // functions to use in the macros {{=funcName,arg1,arg2,...}}
            separator: ",", // separator for macro function arguments
            state: null,    // pass state to functions
            bom: "{{",      // beginning of macro
            eom: "}}",      // end of macro
            nesting: 5,     // max nesting (recursive calls to expand)
            empty: "",      // what to return if a value is not found
            error: true,    // log errors
            warn: false,    // log warnings
            log: false,     // turn on debug log
            debug: false,   // turn on verbose debug log (if !log)
            oops: "",//"💩",     // what to return if an error occurs
        },config);
    }
    expand(...__args) {
        /* 
            __arg:
                string: what to expand
                object: {               // config can override the constructed values
                    text: "",           // what to expand
                    values: {},         // values to use
                    functions: {},      // functions to use
                    state: {},        // pass state to functions
                    nesting: number,    // max recursive nesting
                    empty: string,
                    warn: bool,
                    log: bool
                }
        */
        let arg, config, initialText, text;
        while ((arg=__args.shift()) != undefined) {
            let tp = typeof arg;
            switch (tp) {
                case "string":
                    if (!initialText) {
                        initialText = text = arg;
                    }
                    break;
                case "object":
                    if (!config) {
                        config = arg;
                        if (!initialText) {
                            initialText = text = config.text;
                        }
                    }
                    break;
                default:
                    if (Array.isArray(arg)) {
                        console.error(`GrelMacro.expand[${tp}]: array not allowed (string or object only)`,arg);
                        throw "GrelMacro.expand: array not allowed (string or object only)"
                    } else {
                        console.error(`GrelMacro.expand[${tp}]: gotta pass string to expand, or config object`,arg)
                        throw "GrelMacro.expand: gotta pass string to expand, or config object"
                    }
            }
        }
        if (!config) {
            config = {};
        }
        // config options
        let functions = Object.assign({},this.config.functions,config.functions),
            bom = this.config.bom,
            eom = this.config.eom,
            nesting = config.nesting || this.config.nesting,
            empty = config.empty || this.config.empty,
            error = config.error !== undefined ? config.error : this.config.error,
            warn = config.warn !== undefined ? config.warn : this.config.warn,
            log = config.log || this.config.log, 
            debug = config.debug || this.config.debug,
            values = Object.assign({},this.values,config.values),
            state = config.state || {}, 
            clearIt = !!config.clear,
            errorString = config.oops || this.config.oops,   
            separator = config.separator || this.config.separator,         
            verbose = config.verbose;
        let wantResult, outer, inner, expanded, firstChar, blocks = [], args, fnName, fn, eos, 
            nExpanded = 0, nCommands = 0, nAssigns = 0, nErrors = 0, source;
        if (source = config.source || "") {
            source = ` source: "${source}";`;
        }
        let stack = [];
        error = error ? console.error : (()=>{});
        warn = warn ? console.warn : (()=>{});
        log = log ? console.log : (()=>{});
        debug = debug ? console.debug : (()=>{});
        const processStringAt = (start) => {
            stack.push({
                start,
                passes: 0,
            });
            let beginningStackLength = stack.length;
            while(stack.length >= beginningStackLength) {
                let fail = true, firstBegin,nextBegin,firstEnd,stackItem = stack[stack.length-1];
                try {
                    firstBegin = text.indexOf(bom,stackItem.start);
                    if (firstBegin>=start) {
                        if (stackItem.passes++ < nesting) { // max nesting
                            firstEnd = text.indexOf(eom,firstBegin + bom.length);
                            nextBegin = text.indexOf(bom,firstBegin + bom.length);
                            if (firstEnd > firstBegin) {
                                if (nextBegin > firstBegin && nextBegin < firstEnd) { // nested macro!
                                    processStringAt(nextBegin);
                                    fail = false;
                                } else {
                                    blocks = [];
                                    blocks.push(firstBegin ? text.substring(0,firstBegin) : "");
                                    blocks.push(""); // for the expanded string
                                    eos = firstEnd + eom.length;
                                    if (eos < text.length) {
                                        let endOfString = text.substring(eos);
                                        blocks.push(endOfString);
                                    }
                                    expanded = "";
                                    if (!clearIt) {
                                        outer = text.substring(firstBegin,firstEnd + bom.length);
                                        inner = text.substring(firstBegin + bom.length,firstEnd);
                                        // inner = inner.replace(/</g,"");
                                        if (inner) {
                                            firstChar = inner.charAt(0);
                                            // "." and "=" can both run functions
                                            // "." always returns an empty string
                                            // 
                                            let how = "?"
                                            let hasPrefix = (wantResult=firstChar === "=") || firstChar === "."
                                            if (!config.state || hasPrefix) {
                                                let rawInner = inner

                                                if (hasPrefix) inner = inner.substr(1);
                                                if (!hasPrefix) wantResult = true;
                                                args = inner.split(separator);
                                                // determine whether the first argument is a function name
                                                // -- if so, call it with the arguments
                                                fn = (fnName = args[0]) ? functions[args[0]] : "";
                                                // console.debug(`fn=${fnName}`)
                                                if (fn) {
                                                    state.wantResult = wantResult;
                                                    state.rawInner = rawInner; 
                                                    if (config.state) {
                                                        // replace the name with the state
                                                        args[0] = state; // passing whatever the caller wants
                                                    } else {
                                                        args.shift();    // remove the function name
                                                    }
                                                    try {
                                                        how = "fn"
                                                        // console.debug(`${fnName}.ARGS:`,args.join("/"))
                                                        expanded = fn.apply(null,args);
                                                        // successful commands always return the blank
                                                        if (config.state && firstChar === ".") {
                                                            expanded = "";  // force to blank
                                                            nCommands++;
                                                        } else {
                                                            nAssigns++;
                                                        }
                                                    } catch(err) {
                                                        if (config) {
                                                            let tsNow = Date.now();
                                                            error(`[MACRO] fn[${fnName}].error:`);
                                                            if ((tsNow - __tsLastReportedFunctionWarning) > 1000) {
                                                                error(`[MACRO] fn[${fnName}].error:`,err);
                                                                __tsLastReportedFunctionWarning = tsNow;
                                                            }
                                                        }
                                                        expanded = errorString;
                                                        nErrors++;
                                                    }
                                                    // commands always return the empty string
                                                    // if (firstChar === ".") expanded = "";  // force to blank
                                                } else {
                                                    how = "val"
                                                    // not a function
                                                    // -- extract the value (everything after a "," is a default value)
                                                    expanded = getValue(inner,values);
                                                }
                                            } else {
                                                expanded = getValue(inner,values);
                                                if (!expanded) {
                                                    warn(`[MACRO] key: "${inner}", value: [not found];${source}`);
                                                }
                                            }
                                            if (expanded) {
                                                nExpanded++;
                                                blocks[1] = expanded;
                                                log(`[MACRO] key:"${outer}", value: "${expanded}";`);
                                            } else if (!firstChar !== ".") {
                                                expanded = empty;
                                            }
                                            debug(`${wantResult ? "=" : "."}${how}[${fnName}]: "${expanded}"`);
                                        }
                                    }
                                    text = blocks.join("");
                                    fail = false;
                                }
                            }
                        }
                    }
                } catch (err) {
                    error(`[MACROS] ERROR.processNextMacro:`,err);
                    fail = true;
                }
                if (fail) {
                    stack.pop();
                }
            }
        }
        processStringAt(0);
        state.count = this.count = nExpanded + nCommands;
        state.errors = nErrors;
        let returnValue;
        if (verbose) {
            returnValue = {
                original: initialText,
                result: text,
                count: state.count,
                state,
            } 
        } else {
            returnValue = text;
        }
        return returnValue;
    }
}

module.exports = ContentMacros;
