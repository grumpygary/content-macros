// import ContentMacros from "ContentMacros";
const ContentMacros = require("../src/content-macros");

let options = {
    values: {
        greeting: "Hello",
    },
    functions: {
        say(...args) { 
            return `${args.join(" ")}!`
        }
    }
};
let contentMacros = new ContentMacros(options);

console.log(contentMacros.expand("{{say,{{greeting}},world}}"));
