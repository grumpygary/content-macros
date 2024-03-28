# grel-macros

Powerful content text macros.

## Installing

### NPM

```sh
npm install "grel-macros"
```

### GitHub

```sh
git clone "https://github.com/grumpygary/grel-macros"
```

## Use Case

While javascript template strings are wonderful in most cases,
they're not well suited for content string macros.
grel-macros provides a way to implement and control
content string macros with: string-replacement, nested macros
(use macros to build macros), function sets, etc.

## Syntax

```
import GrelMacros from "grel-macros";

grelMacros.expand(stringToExpend,options);
// or
grelMacros.expand(options);
```

## Macro Syntax

Macros begin with {{ and end with }}.  They may be nested to create interesting results.
Macros objects may have a state, which can be overridden when expanded.

There are 2 types of macros, depending on parameters passed to .expand():
- stateless: (default) If not state is active, options.functions are called without a state.
Also, if the first character is "=" or "." it is ignored.
- stateful: If state is active, the first argument to each function is the state:
    -- if the first character is "=", a value result is returned (defaults to options.empty)
    -- if the first character is ".", "" is returned

```
{{key,...args}}
{{=key,...args}} 
{{.key,...args}}
name               | state    | default         | description
-------------------|----------|-----------------|-------------------------------------------------
{{=name}}          | object   |                 | common key for the timeout.  required
separator     | string   | ","             | argument separator in macro function calls
               // returns EITHER config.functions[name], or config.values[name]
    {{name}}            // returns EITHER config.functions[name], or config.values[name]
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
import { 
    bumpTimeout, timeout, listActiveBumpTimeouts
} from "bump-timeout";

const handler = async (val) => {
    console.log(`Value is "${val}"`)
}

bumpTimeout("test",() => handler("first"),1000);
bumpTimeout("test",() => handler("second"),500);
bumpTimeout("test",() => handler("third"),10);

// only one line of output
//  Value is "third"

```
