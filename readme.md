# content-macros

Powerful content text macros.

## Installing

### NPM

```sh
npm install "content-macros"
```

### GitHub

```sh
git clone "https://github.com/grumpygary/content-macros"
```

## Use Case

While javascript template strings are wonderful in most cases,
they're not well suited for content string macros.
content-macros provides a way to implement and control
content string macros with: string-replacement, nested macros
(use macros to build macros), function sets, etc.

## Syntax

```
import ContentMacros from "content-macros";

ContentMacros.expand(stringToExpend,options);
// or
ContentMacros.expand(options);
```

## Macro Syntax

Macros begin with {{ and end with }} (customizable).
They may be nested to create interesting results.
Macros objects may have a state, which can be overridden when expanded.

There are 2 types of macros, depending on parameters passed to .expand():

- stateless: (default) if not state is active (during instantiation or overridden), options.functions are called without a state.  If the first character is "=" or "." it is ignored.

- stateful: If state is active, the first argument to each function is the state:
    -- if the first character is "=", a value result is returned (defaults to options.empty)
    -- if the first character is ".", "" is returned

### Macro syntax examples
```
{{key,...args}}     // assumes no active state
{{=key,...args}}    // returns a value (whether stateless or stateful)
{{.key,...args}}    // no value if stateful, returns result otherwise


*See __tests__/jest-tests.js in repo for examples.*
```

## Options
```
options:

name          | type     | default         | description
--------------|----------|-----------------|-------------------------------------------------
functions     | object   |                 | common key for the timeout.  required
separator     | string   | ","             | argument separator in macro function calls
function      | function | <none>          | will be called when timeout expires. If missing, the common timeout is cleared.
separator     | string   | ","             | string used to split macro into arguments
state         | boolean  |                 | if exists, is passed as first parameter to functions
bom           | string   | "{{"            | string marking beginning of macro
eom           | string   | "}}"            | string marking end of macro
nesting       | number   | 5               | max recursion depth
empty         | string   | ""              | what to return if expansion is empty
error         | bool     | false           | log error if value not found
warn          | bool     | false           | log warning if value not found
log           | bool     | false           | console.log items
debug         | bool     | false           | console.debug items

```

## Usage (example)

```
import ContentMacros from "ContentMacros";

let config = {
    values: {
        one: 1,
    }
    functions: {
        hello(...args) { return args.join(`Hello ${args.join(" ")`)}
    }
};

console.log()
bumpTimeout("test",() => handler("first"),1000);
bumpTimeout("test",() => handler("second"),500);
bumpTimeout("test",() => handler("third"),10);

// only one line of output
//  Value is "third"

```
