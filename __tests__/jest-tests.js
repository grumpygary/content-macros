const ContentMacros = require("../src/content-macros");

const macroConfig = {
    error: true,
    warn: true,
    log: false,
    empty: "???",
    // debug: true,
    values: {
        string1: "1",
        string2: "two",
        func: "func",
    },
    functions: _staticFunctions = {
        func1(...args) {
            return "ONE:" + args.join(",");
        },
        func2(...args) {
            return "TWO:" + args.join(",");
        },
        func3(state,...args) {
            return "THREE:" + JSON.stringify(state) + "/" + args.join(",");
        },
        func4(state,...args) {
            state.value = "THREE:" + JSON.stringify(state) + "/" + args.join(",");
        },
    }
};
let contentMacros = new ContentMacros(macroConfig);

describe("ContentMacros", () => {
    // let books, movies, quotes, bookId, movieId, quoteId;
    test("FUNC-1", async () => {
        let value = contentMacros.expand("{{func1,aaa,bbb}}");
        expect(value).toBe('ONE:aaa,bbb');
    });
    test("FUNC-2", async () => {
        let value = contentMacros.expand("{{=func2,aaa,bbb}}");
        expect(value).toBe('TWO:aaa,bbb');
    });
    test("FUNC-2a (ignore prefix)", async () => {
        let value = contentMacros.expand("{{.func2,aaa,bbb}}");
        expect(value).toBe('TWO:aaa,bbb');
    });
    test("FUNC-3 with state", async () => {
        let value = contentMacros.expand("{{=func3,aaa,bbb}}",{ state: { test: 1 } });
        expect(value).toBe(`THREE:{"test":1,"wantResult":true,"rawInner":"=func3,aaa,bbb"}/aaa,bbb`);
    });
    test("FUNC-4 with state, change state", async () => {
        let state = {};
        let value = contentMacros.expand("{{.func4,aaa,bbb}}",{ state });
        expect(value === "").toBe(true);
        expect(state.value).toBe(`THREE:{"wantResult":false,"rawInner":".func4,aaa,bbb"}/aaa,bbb`);
    });
    test("STRING", async () => {
        let value = contentMacros.expand("{{string2}}");
        expect(value).toBe('two');
    });
    test("MULTIPLE STRINGS #1", async () => {
        let value = contentMacros.expand("{{=string1}}-{{string2}}");
        expect(value).toBe('1-two');
    });
    test("MULTIPLE STRINGS #2", async () => {
        let value = contentMacros.expand("{{string1}}-{{=string2}}");
        expect(value).toBe('1-two');
    });
    test("NESTED", async () => {
        let value = contentMacros.expand("{{{{func}}{{string1}},ccc,ddd}}");
        expect(value).toBe('ONE:ccc,ddd');
    });
});