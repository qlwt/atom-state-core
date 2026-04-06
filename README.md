# @qyu/atom-state-core

Definition and impelemntation of a global state manager

## Usage Example

```typescript
import * as asc from "@qyu/atom-state-core"

const store = asc.store_new()

const width_atom = asc.value_atom(() => {
    return 10
})

const height_atom = asc.value_atom(() => {
    return 20
})

const size = asc.value_atom(({ reg }) => {
    // store.reg will get existing value from store or register it
    return reg(width_atom) * reg(height_atom)
})

// 200
console.log(store.reg(size))
```

## Concept and Definitions

- This library solves problems related to global state management and remote state management on the client
- `Store` is an object that stores the state
- `Atom` is the way you define the state - it is a function that takes `Store` (and some api) as parameters and registers it's value
- When you register `Atom` into a `Store`, it is saved in the `Store`. Trying to register the same `Atom` in the Store will return saved value
- `Store` does not provide mutability functionality, so any mutable state should be defined with `Signals`

## Basic Components

### Atom Value

Will call cb and register return when called

```typescript
import * as asc from "@qyu/atom-state-core"

const atom = asc.value_atom((store: Store) => {
    return 10
})

// to define a cleanup mechanism in case you delete value from register later
const atom = asc.value_atom_advanced((store: Store) => {
    return {
        value: 10,

        config: {
            cleanup: () => {
                console.log("cleanup")
            },
        },
    }
})
```

### Atom State

Uses return as initial value for signal from @qyu/signal-core

```typescript
import * as asc from "@qyu/atom-state-core"

const store = asc.store_new()

const atom_amount = asc.state_atom(store => {
    return 10
})

const atom_width = asc.state_atom_advanced(store => {
    const controller = new AbortController()

    window.addEventListener("resize", () => {
        store.reg(atom_width).input(window.innerWidth)
    })

    return {
        init: window.innerWidth,

        config: {
            cleanup: () => {
                controller.abort()
            },
        },
    }
})

store.reg(atom_amount).input(50)
// 50
console.log(store.reg(atom_amount).output())
// whatever your webpage width is
console.log(store.reg(atom_width).output())

store.reg(atom_width).addsub(() => {
    console.log(store.reg(atom_width).output())
})
```

### Selectors

- `Selectors` are defined as an `Atom` that does not register a state
- They are intended as an interface for functions that depend on the `Store`, but do not need to memorise the output

```typescript
import * as asc from "@qyu/atom-state-core"

const store = asc.store_new()

const width = asc.value_atom(() => 50)
const height = asc.value_atom(() => 100)

const dimension_new = (iscolumn: boolean) => { 
    return asc.selector_atom(({ reg }) => {
        if (iscolumn) {
            return reg(height)
        }

        return reg(width)
    })
}

// will not be memorised
// 100
console.log(store.reg(dimension_new(true)))
```

### Atom Action

- A function that gets `Store` as a parameter and returns nothing
- A subtype of `Selector`. Does not get memorised

```typescript
import * as asc from "@qyu/atom-state-core"

const store = asc.store_new()
const width = asc.value_atom(() => 10)
const height = asc.value_atom(() => 10)

const action_new = (iscolumn: boolean): asc.Action_Atom => {
    return ({ reg }) => {
        if (iscolumn) {
            console.log(reg(height))
        } else {
            console.log(reg(height))
        }
    }
}

store.dispatch(action_new())
```

### Atom Family

- Behaves very similar to `Store`, maintains its own registry
- Unlike in `Store` accepts custom type, from wich it creates an `Atom`

```typescript
import * as asc from "@qyu/atom-state-core"

const store = asc.store_new()

const atom_family = asc.family_atom_hash(() => ({
    // hash key used to search for an input in the registry
    key: (id: string) => id,
    // Atom will be saved to the family
    get: (id: string) => asc.state_atom(() => ({ value: 0 })),
}))

const family = store.reg(atom_family)

// 0
console.log(family.reg("13").output().value)
// true
console.log(family.reg("13") === family.reg("13"))

family.reg("13").input({ value: 10 })

// 10
console.log(family.reg("13").output().value)
```

## Working with remote state

- It is expected for remote state to be organised in a sql-like manner
- `RemNode` represents a row.
- `Family` of `RemNode` indexed by Primary Key represents a table
- `Indexer` helps with relations between tables and rows
- `Join` helps working resolving relations into structured object
- Also there are utilities to help handling common operations

### RemNode

- Is a collection of signals
- `.real` is a signal representing current state of the node
- `.real.output()` can be either of status `ReqSatate_Status.(Fulfilled|Empty|Pending)`
- `.optimistic` is a family of signals, each representing a pending optimistic update
- `.statics` is a data, that is stable from init. Usually you would want to put Primary Key here
- `.meta` is some additional metadata information
- `RemView` - real state and optimistic updates are stored separately, `RemView` merges them

```typescript
import * as asc from "@qyu/atom-state-core"

// defenition of RemNode
interface Def extends asc.RemNode_Def {
    // content of the row
    data: {
        id: string
        name: string
        value: number
    }

    statics: {
        id: string
    }
}

const store = asc.store_new()

const atom_remnode = asc.remnode_atom<Def>(() => ({
    // initial value of data
    // when null, will be initialised with empty state
    init: null,

    statics: {
        id: "0"
    },

    meta: {
        // which clonning mechanism should be used
        // by default does a shallow clone, you can use immer or deep clone for more advanced cases
        cloner: (data, cb) => {
            const cpy = { ...data }

            cb(cpy)

            return cpy
        },
    },
}))

const remnode = store.reg(atom_remnode)
const remview = asc.remview_new_node(remnode)

// null
console.log(remview.output().data)

// normally you would request that from server
// for that demonstration the process is cut
remnode.real.input(asc.reqstate_new_fulfilled({
    id: "0",
    value: 100,
    name: "item",
}))

// { id: "0", value: 100, name: "item" }
console.log(remview.output().data)

// normally you will not use this directly
remnode.optimistic.reg("main").input({
    kind: "push-schedule",

    patch_new: () => ({
        data: {
            value: 150
        },
        applicator: Object.assign,
    }),

    request_new: () => {
        return {
            promise: Promise.resolve()
        }
    },
})

// { id: "0", value: 150, name: "item" }
console.log(remview.output().data)
```

### Request and Patch actions

- Library provides a set of optimistic and pessimistic requests
- Optimistic requests know what node are they done for, pessimistic - do not
- Example of an optimistic request is a PATCH request to a specific node
- Example of a pessimistic request is a GET request that returns a list of items you know nothing about

### Optimistic Request action

- Request action applied to node will set its state to Pending
- It supports fallbacks and optimistic state when you can assume the output
- It is supposed to be used for GET action when you do not know which content you will recieve, but know for which element request is done
- Or POST or PUT action, where you could assume optimistic value, but it is still Pending as it is not registered in the server
- Or DELETE action, where you can assume optimistic value is Empty, but you would still wait for server to respond

```typescript
import * as asc from "@qyu/atom-state-core"

interface Def extends asc.RemNode_Def {
    // additional data passed on request by user
    // unlike optimistic data, does not need to match the interface of the Def["data"]
    request_meta: null | {
        time: number
    }

    data: {
        id: string
        name: string
        value: number
    }

    statics: {
        id: string
    }
}

const store = asc.store_new()

const data_1 = {
    id: "0",
    value: 100,
    name: "item",
}

const data_2 = {
    id: "0",
    value: 200,
    name: "item:real",
}

const atom_remnode = asc.remnode_atom<Def>(() => ({
    init: data_1,

    statics: {
        id: "0"
    }
}))

const remnode = store.reg(atom_remnode)
const remview = asc.remview_new_node(remnode)

// data_1
console.log(remview.output().data)

// sadly need to pass Def and PromiseResult manually
asc.act_remopt_request<Def, Def["data"]>({
    target: remnode,

    // optional, does not keep fallback by default
    fallback: {
        value: true,
        // if fallback should be used as data in remview when no optimistic value available
        status_view: false,
    },

    // optional
    config: {
        // you can pass more RemNode here, request will only be executed when all of them are Fulfilled
        deps: [],
        // use it to control the execution of request
        signal_abort: undefined,
    },

    // optional, assumed return value, will be used as data in remview
    optimistic: {
        value: data_2,
    },

    request: {
        meta: {
            time: Date.now(),
        },

        // you can use signal_abort to handle when request gets aborted for some reason
        init: ({ signal_abort }) => {
            return new Promise<Def["data"]>(res => {
                setTimeout(() => res(data_2), 50)
            })
        },

        interpret: resapi => {
            return {
                kind: "success",

                reqstate: asc.reqstate_new_fulfilled(resapi.result)
            }
        },

        hook_after: promise => {
            // you can add some listeners to promise after its created
        },
    },
})

{
    const remview_out = remview.output()
    // data_2 is used as optimistic value
    console.log(remview_out.data)
    // true
    if (remview_out.status === asc.ReqState_Status.Pending) {
        console.log("pending")
        // { time: number }
        console.log(remview_out.meta.request)
        // "optimistic"
        console.log(remview_out.meta.source)
    }
}

setTimeout(() => {
    // request is resolved
    const remview_out = remview.output()
    // data_2 is used as fulfilled value
    console.log(remview_out.data)
    // true
    console.log(remview_out.status === asc.ReqState_Status.Fulfilled)
}, 100)
```

### _set variant

- `act_remopt_request` controls when request will be called
- For when you want to keep the control of when request is executed, you can use act_remopt_request_set variant
- It is the same as previous one, but you pass the Promise instead of `.init` 

```typescript
asc.act_remopt_request_set({
    // ...

    request: {
        promise: new Promise(),

        // ...
    },
})
```

### Patch Optimistic action

- Does not influence `.real` state until its done
- Supports optimistic values
- Registers update into `.optimistic` of remnode
- Supports batching multiple patches into one and delaying execution

```typescript
import * as asc from "@qyu/atom-state-core"

interface Def extends asc.RemNode_Def {
    data: {
        id: string
        name: string
        value: number
    }

    statics: {
        id: string
    }
}

const store = asc.store_new()

const data_1 = {
    id: "0",
    value: 100,
    name: "item",
}

const patch_1 = {
    value: 150,
}

const patch_2 = {
    name: "real:item"
}

const atom_remnode = asc.remnode_atom<Def>(() => ({
    init: data_1,

    statics: {
        id: "0"
    }
}))

const remnode = store.reg(atom_remnode)
const remview = asc.remview_new_node(remnode)

// data_1
console.log(remview.output().data)

asc.act_remopt_patch({
    // name of the kind of request
    // requests of the same name can be merged together
    name: "main",
    target: remnode,

    config: {
        deps: [],
        // by default request will only be launched when target is Fulfilled
        // to disable that behaviour - set deps_noself: true
        deps_noself: false,
        signal_abort: undefined,
        // will delay the execution of request
        // when new patch is called while one is scheduled, they will merge the data instead
        // library also exports debouncers
        callbatcher: asc.throttler_new_delay(50),

        schedule_config: {
            // ignore callbatcher
            instant: false,
            // do not wait for pending patches to finish
            force: false,
        },
    },

    optimistic: {
        // flat means treating patch as a shallow object
        // alternative methods are "deep" for deep merge
        // "custom" for custom data unrelated to remnode's body
        // "raw" for "low level" access to patch creation
        // it is important to ensure, that patch of same name share compatible data
        // otherwise, unexpected behaviour will occur and types will not notify you of it
        kind: "flat",
        merge: true,
        patch: patch_1,
    },

    request: {
        init: ({ signal_abort, patch }) => {
            // patch_1
            // in this example will not be called as this patch will be overriten
            console.log(patch?.data)
            // patch is resulting optimistic data after all merges
            return new Promise<void>(res => {
                setTimeout(() => res(), 50)
            })
        },

        // reutrn new data
        interpret: api => {
            // api.data_patched returns real data with patch applied
            // if the way you apply the patch is dependent on promise result, use api.result and api.data_real()
            return api.data_patched()
        },

        hook_after: promise => {
            // you can add some listeners to promise after its created
        },
    },
})

// { ...data_1, ...patch_1 }
console.log(remview.output().data)

asc.act_remopt_patch({
    // same name, patches will be merged
    name: "main",
    target: remnode,

    optimistic: {
        kind: "flat",
        merge: true,
        patch: patch_2,
    },

    request: {
        init: ({ signal_abort, patch }) => {
            // { ...patch_1, ...patch_2 }
            console.log(patch?.data)

            return new Promise<void>(res => {
                setTimeout(() => res(), 50)
            })
        },

        interpret: api => {
            return api.data_patched()
        },
    },
})

// { ...data_1, ...patch_1, ...patch_2 }
console.log(remview.output().data)
```

### _set variant

- Just like with `act_remopt_request`, `act_remopt_patch` has a `_set` variant

```typescript
asc.act_remopt_patch_set({
    // ...

    request: {
        promise: new Promise(),

        // ...
    },
})
```

### Pessimistic request actions

- Each of `act_remopt_*` has its `act_rempes_*` variant
- Unlike optimistic ones, pessimistic request actions do not support fallback and optimistic values
- Their interface is similar, but in the end you return an array of `RemNode` that are to be modified

```typescript
import * as asc from "@qyu/atom-state-core"

asc.act_rempes_patch({
    config: {
        // control execution
        signal_abort: undefined,
        deps: [],
    },

    request: {
        // return an array of patches
        interpret: api => {
            return [
                {
                    target: remnode,

                    patch: {
                        // flat will make a shallow merge
                        // alternatives are: "deep" for deep merge
                        // or "raw", where you specify the resulting state
                        kind: "flat",
                        data: api.result,
                    }
                }
            ]
        },

        init: () => {
            return wait(20).then(() => patch_1)
        },
    }
})

asc.act_rempes_request({
    config: {
        deps: [],
        signal_abort: undefined
    },

    request: {
        init: () => {
            return wait(20).then(() => data_1)
        },

        interpret: api => {
            return [
                {
                    target: remnode,
                    reqstate: asc.reqstate_new_fulfilled(api.result)
                }
            ]
        },
    }
})
```

## Joins

- Assume you have two rows `A` and `B`, where `A.b_id` references `B`
- You will likely often need to have data from both rows
- Joins solve that problem by providing interface to resolve relations between rows
- join_new_remnode will usually be an entry point. It accepts remnode and nested joins
- As an output you will have `{ core: RemView<Def>, joins: /* your joins */ }`
- Every join has a `newf` variant that helps with automatic type inference
- Most joins have a `news` variant that is an shortcut for calling `newf` with parameters object represented as multiple parameters

```typescript
import * as asc from "@qyu/atom-state-core"

interface DefA extends asc.RemNode_Def {
    statics: { id: string }

    data: {
        id: string
        name: string
        b_id: string
    }
}

interface DefB extends asc.RemNode_Def {
    statics: { id: string }

    data: {
        id: string
        name: string
        value: number
    }
}

const store = asc.store_new()

// define tables
const table_a = store.reg(
    asc.family_atom_hash(() => ({
        key: (id: string) => id,

        get: (id: string) => asc.remnode_atom<DefA>(() => ({
            init: null,
            statics: { id },
        }))
    }))
)

const table_b = store.reg(
    asc.family_atom_hash(() => ({
        key: (id: string) => id,

        get: (id: string) => asc.remnode_atom<DefB>(() => ({
            init: null,
            statics: { id },
        }))
    }))
)

table_a.reg("a:0").real.input(asc.reqstate_new_fulfilled({
    id: "a:0",
    b_id: "b:0",
    name: "name_a",
}))

table_b.reg("b:0").real.input(asc.reqstate_new_fulfilled({
    id: "b:0",
    value: 100,
    name: "name_b",
}))

// types for joins are defined like that
type JoinB = asc.Join_RemNode<DefB, {}>

type JoinA = asc.Join_RemNode<DefA, {
    b: NonNullable<JoinB["data"]>
}>

// types will be correctly inferred, so explicit typing is not needed
// but having it improves display of the type, so it is recomended
const join: asc.Join<string, JoinA> = asc.join_new_remnode({
    link_new: (id: string) => table_a.reg(id),

    joins: {
        // pipeo_expdata is used to extract data instead of serving the whole view
        // pipeo_expdata also insures data is not required (if data is null, it will nullify the whole object)
        // when data is not required, use pipeo_data
        b: asc.join_news_pipeo_expdata(
            asc.join_news_pipei_data(
                data => data.b_id,

                asc.join_new_remnode({
                    link_new: (id: string) => table_b.reg(id),
                    joins: {},
                } as const),
            )
        )
    } as const,
} as const)

// returns Join_Option, which is basically Maybe<T> type
// it is not very convenient to work with it that way, so there is join_root_normalize utility
const join_root = join.root("a:0")

if (join_root.kind === asc.Join_Option_Kind.View) {
    const output = join_root.value.output()

    if (output.kind === asc.Join_Option_Kind.View) {
        const data = output.value.data

        // in this case data is guaranteed to be non-nullish
        if (!data) { throw new Error(`data is expected to be non nullish`) }

        // name_a has name_b of value 100
        console.log(`${data.core.name} has ${data.joins.b.core.name} of value ${data.joins.b.core.value}`)
    }
}

// null | OSignal<JoinB | null>
const join_nroot = asc.join_root_normalize(join_root)

// { core: DefA["data"], joins: { b: { core: DefB["data"], joins {} } } }
const data = join_nroot?.output()?.data

// in this case data is guaranteed to be non-nullish
if (!data) { throw new Error(`data is expected to be non nullish`) }

// name_a has name_b of value 100
console.log(`${data.core.name} has ${data.joins.b.core.name} of value ${data.joins.b.core.value}`)
```

### Joins variants

- `join_new_remnode` joins `RemNode` with `.joins`, divides `.joins` and `.core` data
- `join_new_remnode_full` same as `join_new_remnode`, but expects `.data` to be non-null
- `join_new_remnode_merge` joins `RemNode` with `.joins`, merges them together (`.joins` override `.core`)
- `join_new_remnode_merge_full` same as `join_new_remnode_merge`, but expects `.data` to be non-null
- `join_new_remdata` same as `join_new_remnode`, but extracts `.data`
- `join_new_remdata_merge` same as `join_new_remnode_merge`, but extracts `.data` 
- `join_new_remdata_full` same as `join_new_remdata`, but expects `.data` to be non-null
- `join_new_remdata_merge_full` same as `join_new_remdata_merge`, but expects `.data` to be non-null 
- `join_new_list` allows joining a list from an `Iterable` property
- `join_new_list_flat` allow joining a list for an `OSignal<Iterable>` property
- `join_new_pipei_data` allows to pipe .data property of the root into parameter for child
- `join_new_pipei` is more general version that is pipes from root's value directly
- `join_new_pipeo` pipes output of child
- `join_new_pipeo_data` extracts .data property of child
- `join_new_pipeo_expdata` extract .data proprty of child expecting it to be non-nullish
- `join_new_filteri` filters inputs coming from root
- `join_new_filtero` filters outputs coming from child
- `join_new_filtero_withdata` filters outputs where `.data` is non-nullish
- `join_new_fallbacko` provides fallback output for child when output is `None`
- `join_new_fallbacki` provides fallback input for child when it is `None`

### Automatic inference of types in join_* functions

- It is rather tricky, just play around with `new_*`, `newf_*` variants and `as const` for parameters object

## Indexers simplify emulating many-to-one relations

- After configuring and connecting an `Indexer` it will watch for changes in the table
- Then you use `.filter([null, Filter])` to get an `OSignal<Iterable>` of elements that match the query
- After that you can use it individually or with `join_new_list_flat` to join relations

```typescript
import * as asc from "@qyu/atom-state-core"

interface DefA extends asc.RemNode_Def {
    statics: { id: string }

    data: {
        id: string
        name: string
    }
}

interface DefB extends asc.RemNode_Def {
    statics: { id: string }

    data: {
        id: string
        name: string
        value: number
        a_id: string
    }
}

const store = asc.store_new()

const table_a = store.reg(
    asc.family_atom_hash(() => ({
        key: (id: string) => id,

        get: (id: string) => asc.remnode_atom<DefA>(() => ({
            init: null,
            statics: { id },
        }))
    }))
)

const table_b = store.reg(
    asc.family_atom_hash(() => ({
        key: (id: string) => id,

        get: (id: string) => asc.remnode_atom<DefB>(() => ({
            init: null,
            statics: { id },
        }))
    }))
)

table_a.reg("a:0").real.input(asc.reqstate_new_fulfilled({
    id: "a:0",
    name: "name_a",
}))

table_b.reg("b:0").real.input(asc.reqstate_new_fulfilled({
    id: "b:0",
    a_id: "a:0",
    value: 100,
    name: "name_b:0",
}))

table_b.reg("b:1").real.input(asc.reqstate_new_fulfilled({
    id: "b:1",
    a_id: "a:0",
    value: 200,
    name: "name_b:1",
}))

// indexers can be used standalone
// but defining them in a family simplifies api-access
// family does:
// 1. Creates Indexer
// 2. Connects Indexer
// 3. Calls indexer.filter([null, Filter]) on .reg and memorises it
const indexer_fam = store.reg(
    asc.family_atom_indexer(() => ({
        // will use JSON.stringify by default
        key: filter => filter.a_id,

        indexer_new: () => {
            return asc.indexer_new_wrap({
                data_new: (in_data: asc.RemView<DefB>) => {
                    if (in_data.data === null) {
                        // not indexed
                        return null
                    }

                    // .value goes to the indexer
                    return {
                        value: [in_data.data.a_id] as const
                    }
                },

                filter_new: (in_filter: { readonly a_id: string }) => {
                    // goes to the indexer
                    return [in_filter.a_id] as const
                },

                indexer: asc.indexer_new_pipe_head({
                    right_newf: asc.indexer_newf_list_pure<asc.RemNode<DefB>>(),

                    steps: [
                        // you define an indexer for each field/cluster
                        // you need to manually specify NodeType and DataType for them
                        asc.indexer_newl_identity<asc.RemNode<DefB>, string>(),
                    ] as const,
                }),
            })
        },

        indexer_connect: indexer => asc.indexer_connect_family_remnode({
            indexer,
            src: table_b,
            view_new: asc.remview_new_node,
            // to batch changes in the family
            callbatcher: asc.throttler_new_immediate(),
        }),
    }))
)

type JoinB = asc.Join_RemNode<DefB, {}>

type JoinA = asc.Join_RemNode<DefA, {
    b: NonNullable<JoinB["data"]>[]
}>

const join: asc.Join<string, JoinA> = asc.join_new_remnode({
    link_new: (id: string) => table_a.reg(id),

    joins: {
        b: asc.join_newf_pipei_data({
            // transform data of the root to an indexer
            transformer: data => indexer_fam.reg({ a_id: data.id }),

            // pipe it to the listflat
            join: asc.join_news_listflat(asc.join_news_pipeo_expdata(
                asc.join_newf_pipei({
                    transformer: param => param.statics.id,

                    join: asc.join_new_remnode({
                        link_new: (id: string) => table_b.reg(id),

                        joins: {} as const,
                    })
                })
            )),
        } as const)
    } as const,
})

// null | OSignal<JoinA | null>
const join_nroot = asc.join_root_normalize(join.root("a:0"))

// will have two children
console.log(join_nroot?.output()?.data)

// add one more related B
table_b.reg("b:2").real.input(asc.reqstate_new_fulfilled({
    id: "b:2",
    a_id: "a:0",
    value: 200,
    name: "name_b:3",
}))

// will have three children
console.log(join_nroot?.output()?.data)
```

### Terminology Kinds of Indexers

- `Indexer` - stateful, allows inputs and outputs
- `IdxRouter` - link between two indexers. If you have `idx_a` piping information to `idx_b`, it does it through router
- `IdxRouter` - is compatible with `Indexer` when `Indexer` accepts no parameters. `indexer_new_list_pure` can be used as router
- `IndexerF` - a function with no parameters that returns `Indexer`
- `IndexerL` - a function with `IdxRouterF` parameter that return `Indexer` connected to given router
- Most of `indexer_new` function have `indexer_newf` and `indexer_newl` variants for convenience

- field-indexers:
    - `indexer_new_identity` - general purpose `Object.is()` indexer uses `Map`
    - `indexer_new_boolean` - indexer for booleans
    - `indexer_new_switch` - indexer for small integers, uses direct-access table
- meta-indexers:
    - `indexer_new_optional` - makes field optional
    - `indexer_new_logic` - allows using logic gates
- collectors:
    - `indexer_new_list_pure` - collects nodes out-of-order
    - `indexer_new_list_sorted` - collects nodes in-order
- utility
    - `indexer_new_pair` - connects left indexer to right one
    - `indexer_new_pair_head` - connects left indexer to right one assuming right does not take parameters
    - `indexer_new_pipe` - makes a chain of indexers
    - `indexer_new_pipe_head` - makes a chain of indexers assuming right one does not take parameters
    - `indexer_new_wrap` - transformer for incoming `Data` and `Filter`
    - `indexer_new_wrapi` - transformer for incoming `Data`
    - `indexer_new_wrapo` - transformer for incoming `Filter`
    - `indexer_new_wrapi_strip` - transformer for incoming `Data`, returns `IdxInput` (writeonly `Indexer`)
    - `indexer_new_wrapo_strip` - transformer for incoming `Filter`, returns `IdxOutput` (readonly `Indexer`)

## Loading Data globally

- `Loader` is used for loading data globally
- It exposes `.request` function. It counts all requests from the app and creates a connection when needed
- Connections for each loader are managed in a centralised way
- `loader_new_pure` accepts no parameters on `.request`
- `loader_new_concurrent` accepts a parameter and only creates a connections with the most important one (defined by `Comparator`)

### Using `Loader` to load paginated data

```typescript
import * as asc from "@qyu/atom-state-core"
import * as sc from "@qyu/signal-core"

interface RemDef extends asc.RemNode_Def {
    data: {
        id: number
        value: number
    }

    statics: {
        id: number
    }
}

const items: RemDef["data"][] = Array.from({ length: 30 }, (_, i) => {
    return {
        id: i,
        value: Math.random(),
    }
})

const store = asc.store_new()

const atom_remfam = asc.family_atom_hash(() => {
    return {
        key: (id: number) => id.toString(),

        get: (id: number) => asc.remnode_atom<RemDef>(() => ({
            init: null,

            statics: {
                id
            },
        }))
    }
})

const atom_idxfam = asc.atom_flat(({ reg }) => asc.family_atom_indexer(() => {
    return {
        key: param => param && param.toString(),

        indexer_new: asc.indexer_newf_wrap({
            indexer: asc.indexer_new_list_sorted<asc.RemNode<RemDef>, number>({
                comparator: (a, b) => a - b,
            }),

            data_new: (in_data: asc.RemView<RemDef>) => {
                if (in_data.data) {
                    return { value: in_data.data.id }
                }

                return null
            },

            filter_new: (in_filter: number | null) => {
                return {
                    bound_end: typeof in_filter === "number" ? {
                        inclusive: true,
                        value: in_filter,
                    } : null,
                }
            },
        }),

        indexer_connect: indexer => {
            return asc.indexer_connect_family_remnode({
                indexer,
                src: reg(atom_remfam),
                view_new: asc.remview_new_node,
                // using microtask throttler to prevent execution every time an item is added
                callbatcher: asc.throttler_new_microtask(),
            })
        },
    }
}))

// you can use family for requests that invole search parameters
const atom_cursor = asc.state_atom<null | { value: number | null }>(() => ({ value: null }))

type ApiRes = {
    readonly items: RemDef["data"][]
    readonly status_finished: boolean
}

const api_get = async function(cursor: number | null): Promise<ApiRes> {
    await new Promise(resolve => setTimeout(resolve, 1e3))

    if (cursor === null) {
        const items_slice = items.slice(0, 10)

        return {
            items: items_slice,
            status_finished: items_slice.length === items.length,
        }
    } else {
        const items_filtered = items.filter(item => item.id > cursor)
        const items_slice = items_filtered.slice(0, 10)

        return {
            items: items_slice,
            status_finished: items_slice.length === items_filtered.length,
        }
    }
}

// you can use family for request with search parameters
const atom_loader = asc.loader_atom_pure(({ reg }) => ({
    callbatcher: asc.throttler_new_microtask(),

    connect: () => {
        const remfam = reg(atom_remfam)
        const cursor_s = reg(atom_cursor)

        const query = asc.query_new_pure({
            status_finished: cursor_s.output() === null,

            request_new: async (api) => {
                const result = await api_get(cursor_s.output()!.value)

                if (api.signal_abort.aborted) { return false }

                for (const item of result.items) {
                    // register an item to the family
                    remfam.reg(item.id).real.input(
                        asc.reqstate_new_fulfilled(item)
                    )
                }

                if (result.status_finished) {
                    cursor_s.input(null)

                    return true
                } else {
                    cursor_s.input({ value: result.items.at(-1)!.id })

                    return false
                }
            },
        })

        const query_sub = () => {
            const query_status_o = query.status.output()

            if (query_status_o === asc.Query_Status.Idle) {
                query.load()
            }
        }

        query.status.addsub(query_sub)

        query_sub()

        return () => {
            query.status.rmsub(query_sub)
            query.clear()
        }
    },
}))

const idxfam = store.reg(atom_idxfam)
const loader = store.reg(atom_loader)

// you would theoretically request it from a list when it is scrolled to bottom
loader.request()

const list = sc.osignal_new_pipeflat(
    store.reg(atom_cursor),
    // need to bound it to prevent islands to leak into sequence
    cursor => {
        // when cursor is { value: null } meaning not yet initialised - use -Infinity to get empty array
        // when cursor is { value: number } meaning it is ongoing - use .value as a limit
        // when cursor is null meaning pagination is finished - use no limit
        return idxfam.reg(
            cursor === null ? null : cursor.value ?? Number.NEGATIVE_INFINITY
        )
    }
)

list.addsub(() => {
    console.log([...list.output()].map(item => asc.remview_new_node(item).output().data))
})
```

## Loading data Locally

- `query_new_pure` and `paginator_new_pure` do not provide much functionality
- They just act as an interface for calling remote request
- They expose `.status` `.load()` and `.clear()` properties

```typescript
import * as asc from "@qyu/atom-state-core"

const query = asc.query_new_pure({
    status_finished: false,

    config: {
        retry: {
            delay: 10,
        }
    },

    request_new: api => {
        return Promise.resolve().then(() => {
            if (!api.signal_abort.aborted) {
                // ... do effect

                return false
            }

            return true
        })
    },
})

console.log(query.status.output())

query.load()

console.log(query.status.output())

query.clear()

console.log(query.status.output())
```

```typescript
import * as asc from "@qyu/atom-state-core"

let id = 0

const paginator = asc.paginator_new_pure<number>({
    init: {
        cursor: id >= 100 ? null : {
            value: id,
        },
    },

    config: {
        retry: {
            delay: 10,
        }
    },

    request_new: api => {
        return Promise.resolve().then(() => {
            if (!api.signal_abort.aborted) {
                // ... do effect
            }

            if (id >= 100) {
                return {
                    cursor: null
                }
            }

            return {
                cursor: { value: id += 10 }
            }
        })
    },
})

console.log(paginator.status.output())

paginator.load()

console.log(paginator.status.output())

paginator.clear()

console.log(paginator.status.output())
```
