# @qyu/atom-state-core

Definition and impelemntation of atomic state manager

## Usage Example

```typescript
const store = atomstore_new()

const width = atomvalue_new(() => {
    return 10
})

const height = atomvalue_new(() => {
    return 20
})

const size = atomvalue_new(store => {
    // store.reg will get existing value from store or register it
    return store.reg(width) * store.reg(height)
})

console.log(sotre.reg(size))
```

## Concept

- Create handlers - functions that accept store as parameter and do things
- Calling it will store.reg() will return cached value or register it
- All values in register are defined once and you should use signals for listen api and mutability

## Atom Value

Will call cb and register return when called

```typescript
const atomvalue = atomvalue_new(store => {
    return 10
})
```

## Atom State

Uses return as initial value for signal from @qyu/signal-core

```typescript
const atomstate = atomstate_new(store => {
    return 10
})

store.reg(atomstate).input(50)
// 50
console.log(store.reg(atomstate).output())
```

## Atom Selector

Will return value based on store, but does not get cached. Useful for transforming state

```typescript
const atomvalue = atomvalue_new(() => 10)

const atomselector = (store: AtomStore) => ({ 
    value: store.reg(atomvalue) 
})

// false
console.log(store.reg(atomselector) === store.reg(atomselector))
```

## Atom Action

Just a function that has AtomStore as a parameter

```typescript
const atomvalue = atomvalue_new(() => 10)

const atomaction = (store: AtomStore) => {
    console.log(store.reg(atomvalue)) 
}

// 10
atomaction(store)
```

## Atom Family

Basically a cached map

```typescript
const atomfamily = atomfamily_new({
    // value will be cached inside family
    get: (a: number, b: number) => atomvalue_new({ a, b }),
    // unique key that value will be cached with
    key: (a: number, b: number) => `${a} ${b}`
})

const family = store.reg(atomfamily)

family.reg(10, 51)
```

## Atom Selector Child

Utility to get child selector from family

```typescript
const atomfamily = atomfamily_new({
    // value will be cached inside family
    get: (a: number, b: number) => atomvalue_new({ a, b }),
    // unique key that value will be cached with
    key: (a: number, b: number) => `${a} ${b}`
})

const selector = atomfamily_sel_child({
    params: [10, 15],
    family: atomfamily
})

// { a: 10, b: 15 }
console.log(store.reg(selector))
```

## Atom RemState

Represents Remote State

```typescript
// reqstate is a special state that exists in three different variants: empty, pending, fulfilled
// it's pretty intuitive and this section has enough examples of usage with commets
const atomremote = atomremstate_new<string>(store => reqstate_new_empty())

const remote = store.reg(atomremote)

const api_request = () => {
    let id: Timer

    return reqstate_new_pending<string>({
        promise: new Promise(resolve => {
            id = setTimeout(
                () => {
                    // may resolve with any kind of reqstate emptying state, initiating new request or fulfilling
                    resolve(reqstate_new_fulfilled("Hello World"))
                },
                500
            )
        }),

        abort: () => clearTimeout(id)
    })
}

remote.addsub(() => {
    console.log(
        // extract data from reqstate, use null on fallback, second paramter is set on default
        reqstate_data(remote.output(), () => null)
    )
})

// will pring null
remote.input(api_request())
// will abort previous request
// also will print null again
remote.input(api_request())
// in 0.5 seconds will pring "Hello World"
```

## Atom RemReq

Made to hold request state. Intended to be used as tracker for requests or optimistic updates

```typescript
const remreq = store.reg(atomremreq_new())

const api = function () {
    let interrupted = false
    let reject: VoidFunction | undefined = undefined

    return {
        data: {
            name: "John Smith",
        },

        abort: () => {
            interrupted = true

            reject?.()

            console.log("aborted")
        },

        promise: new Promise((res, rej) => {
            reject = rej

            setTimeout(() => {
                if (!interrupted) { resolve() }
            }, 500)
        })
    }
}

// will register request with data
remreq.input(api())

// { name: "John Smith" }
console.log(remreq.output().data)

// interrupts previous request
remreq.input(api())
```

## Atom Selector Remote Data

Utility selector to get data from remotedata

```typescript
const atomremote = remstate_new<string>(() => reqstate_new_empty())
// second argument is fallback value, it's optional and () => null by default
const atomremote_data = remstate_sel_data(atomremote, () => null)

const remote = store.reg(atomremote)
const remote_data = store.reg(atomremote_data)

remote_data.addsub(() => {
    console.log(remote_data.output())
})

remote.input(reqstate_new_empty())
remote.input(reqstate_new_fulfilled("Hello World"))
remote.input(reqstate_new_empty())
```

## Atom Loader

Connects when requested, disconnected when does not

### Atom Loader Pure

Does not get any paramters
Example with requesting user data

```typescript
const atomstate_id = atomstate_new<number>(() => 0)
const atomremote = atomremstate_new<string>(() => reqstate_new_empty())

// fake api request
const api_request_user = function (id: number, signal: AbortSignal): Promise<string> {
    return new Promise((resolve) => {
        let timer: Timer

        const interrupt = () => {
            resolve(reqstate_new_empty())

            clearTimeout(timer)
            signal.removeEventListener("abort", interrupt)
        }

        if (!signal.aborted) {
            signal.addEventListener("abort", interrupt)

            id = setTimeout(
                () => {
                    resolve(JSON.stringify({ name: "username", id }))
                },
                500
            )
        }
    })
}

const atomloader = atomloader_new_pure({
    // will start connection immediately when requested
    throttler: throttler_new_immediate(),
    // as alternative - use microtask throttler, it will schedule requests with Promise.resolve()
    // very usefull to prevent unnecessary requests when loader connection is unstable for some reason (eg. react effect hooks)
    // throttler: throttler_new_microtask(),

    connect: store => {
        const remote = store.reg(atomremote)
        const state_id = store.reg(atomstate_id)

        return signal_listen({
            target: state_id,

            config: {
                emit: true
            },

            listener: () => {
                const id = state_id.output()
                const abortcontroller = new AbortController()
                const promise = api_request_user(id, abortcontroller.signal)
                // adapt promise for expected format
                const promise_wrapped = promise.then(reqstate_new_fulfilled).catch(reqstate_new_empty)

                remote.input(reqstate_new_pending({
                    promise: promise_wrapped,
                    abort: () => abortcontroller.abort()
                }))

                return () => abortcontroller.abort()
            }
        })
    }
})

const remote = store.reg(atomremote)
const loader = store.reg(atomloader)
const state_id = store.reg(atomstate_id)

remote.addsub(() => {
    console.log(asc.reqstate_data(remote.output()))
})

// will start request for initial value of id
// calling request from multiple places will increase internal counter so you need to cancel all of them to interrupt loader
const cancel = loader.request()

// will interrupt previous one and start request for new input
state_id.input(50)

// change parameter after some time
setTimeout(() => {
    state_id.input(90)

    // cancel loader after some time, value stays in remote
    setTimeout(() => {
        cancel()
    }, 1000)
}, 1000)
```

## Atom Loader Concurrent

Similar to pure loader, but accepts parameter and calls connection with higher priority parameter, restarts every time it changes

```typescript
const atomloader = atomloader_new_concurrent<[number, number]>({
    throttler: throttler_new_microtask(),

    comparator: (a, b) => {
        return a[0] + a[1] - b[0] - b[1]
    },

    connect: (a, b) => store => {
        console.log({ a, b })

        return () => {
            console.log("cleanup", { a, b })
        }
    }
})

const loader = store.reg(atomloader)

const cancel_low = loader.request(1, 2)
// will be on top
const cancel_top = loader.request(5, 7)
const cancel_mid = loader.request(3, 5)

// no printing anything yet because connection is throttled
setTimeout(() => {
    // does nothing
    cancel_mid()

    setTimeout(() => {
        // second one is on top so will reconnect
        cancel_top()

        setTimeout(() => {
            // clear connection completely
            cancel_low()
        }, 100)
    }, 100)
}, 100)
```

## Handling remote data with AtomRemoteNode

Designed specifically for sql-like data sorted in nodes and tables (families in this case).

```typescript
const store = atomstore_new()

// node definition
type ItemDef = {
    // it defines what meta (additional information attached to request) and result you could have in pending requests
    // normally you dont need it, just put to any
    request_meta: any
    request_result: any

    // available when resolved, may change
    data: {
        id: string
        name: string
        amount: number
        // references to other nodes, will talk about it later
        param: string
        params: string[]
    }

    // available always, never change
    statics: {
        id: string
    }
}

// define family for nodes
const item_family = atomfamily_new({
    key: (id: string) => id,

    get: (id: string) => atomremnode_new<ItemDef>({
        statics: () => ({ id }),

        init: () => {
            // example of cache restoration, optional
            const data = localStorage.getItem(`node:${id}`)

            if (data) {
                return JSON.parse(data) satisfies ItemDef["data"]
            }

            return null
        },
    })
})

// {
//     statics: statics of node
//     real: remstate of current data
//     optimistic: family of optimistic updates
// }
console.log(store.reg(item_family).reg(""))

// to actually use it - resolve it
const item_data = atomremnode_data({ remnode: ({ reg }) => reg(item_family).reg("") })

// {
//     status: ReqState__Status - status of data - Empty, Pending, Fulfilled
//     data: ItemDef["data"] | null - Empty can only have null data, Fulfilled can only have filled data, Pending could have either
//
//     meta: {
//         source: "direct" | "optimistic" | "fallback" - Kind of data - when no optimistic or fallback provided is "direct" source
//     }
// }
console.log(store.reg(item_data).output())

// to join multiple tables use join function set
// create different table
type Param_Def = {
    request_meta: any
    request_result: any

    statics: {
        id: string
    }

    data: {
        id: string
        formula: string
    }
}

const param_family = atomfamily_new({
    key: (id: string) => id,

    get: (id: string) => atomremnode_new<Param_Def>({
        init: () => null,
        statics: () => ({ id }),
    })
})

// join
const itemjoin = atomremnode_join_root({
    link: atomfamily_sel_childlink(item_family),

    properties: {
        // resolve singular property
        param: atomremnode_join_prop({
            source: atomremnode_join_root({
                properties: {},
                link: atomfamily_sel_childlink(param_family),
            })
        }),

        // resolve array
        params: atomremnode_join_array({
            source: atomremnode_join_root({
                properties: {},
                link: atomfamily_sel_childlink(param_family),
            })
        })
    }
})

// resolve.
const joined = store.reg(itemjoin)("item_id").output()

// top level output is nullish - should check
if (joined) {
    // properties are replaced by nodes they refered to
    console.log(joined.data?.param.data?.formula)
    console.log(joined.data?.params.map(param => param.data?.formula))

    // properties are memorised by default so only thigs that actually changed are changing on update
}

// actions are generalised interactions with nodes

// patch action applies optimistic state and sends request of patch when node is ready (fulfilled)
// aborts if node is empty and inactive (not pending)
// if no optimistic update needed - data can be left to {}
// typescript can not infer types there so you write generics by hand <NodeDef, ?PromiseResult>
atomremnode_action_patch<ItemDef, string>({
    // target node
    node: atomfamily_sel_child({ family: item_family, index: "itemid" }),
    // patch name, patches with same names may be merged depending on config
    name: "patch",

    data: {
        // in real case scenario patch that increasis amount by 1
        // would resolve node (it includes optimistic updates) and get amount from it and increase it
        amount: 5
    } as const,

    config: {
        // merge if some data already provided
        // new properties will override previous one
        merge: true,

        // delay before sending, useful for high intensity updates like description change
        delay: 1500,
    },

    // make request
    // api includes .data which is merged optimistic data and .real which is real data without optimistic updates
    request: api => ({
        // abort request
        promise_abort: () => { },

        // promise for request you are making with this update
        promise: Promise.resolve("qwerty"),

        // attach you own events
        promise_after: promise => {
            promise.then(console.log.bind("afterpromise"))
        },

        // interpret result
        promise_interpret: result => {
            if (result === "success") {
                return api.data
            }

            return null
        }
    }),
})

// request action used for get and post requests
// applies optimistic state if provided, fallback if allowed
// typescript can not infer types there so you write generics by hand <NodeDef, ?PromiseResult, ?PromiseMeta>
atomremnode_action_request<ItemDef, string>({
    // nullish
    optimistic: {
        // optimistic target
        node: atomfamily_sel_child({ family: item_family, index: "itemid" }),

        // nullish
        data: {
            id: "itemid",
            name: "newitem",
            amount: 0,
            param: "param",
            params: []
        },
    },

    request: () => ({
        // meta for request
        meta: {},

        // abort promise
        promise_abort: () => { },
        // request promise
        promise: Promise.resolve("itemid"),

        // attach your events
        promise_after: promise => {
            promise.then(console.log.bind("requested"))
        },

        // you might now know what will be index when posting so target node is defined after interpretation is optimistic is not provided
        // nullish, will throw if neither optimistic nor real target provided
        promise_target: data => {
            return atomfamily_sel_child({ family: item_family, index: data.id })
        },

        // interpret promise
        promise_interpret: (result, meta) => {
            if (result === "success") {
                return {
                    id: "itemid",
                    name: "newitem",
                    amount: 0,
                    param: "param",
                    params: []
                }
            }

            return null
        }
    }),

    config: {
        // if node is already filled then it will be saved and applied if failure
        fallback: false,
    }
})

// both patch and request have _set variant that listen to existing request instead of creating new one
// useful when you have batch requests such as api_patchall() that will affect multiple nodes
atomremnode_action_request_set<ItemDef, string>({
    optimistic: {
        node: atomfamily_sel_child({ family: item_family, index: "itemid" }),

        data: {
            id: "itemid",
            name: "newitem",
            amount: 0,
            param: "param",
            params: []
        },
    },

    request: {
        meta: {},
        promise: Promise.resolve("itemid"),
        promise_abort: () => { },

        promise_target: data => {
            return atomfamily_sel_child({ family: item_family, index: data.id })
        },

        promise_interpret: (result, meta) => {
            if (result === "success") {
                return {
                    id: "itemid",
                    name: "newitem",
                    amount: 0,
                    param: "param",
                    params: []
                }
            }

            return null
        }
    },

    config: {
        fallback: false,
    }
})
```
