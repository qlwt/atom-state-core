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

## Atom Remote

Represents Remote State

```typescript
// reqphase is a special state that exists in three different variants: empty, pending, fulfilled
// it's pretty intuitive and this section has enough examples of usage with commets
const atomremote = atomremote_new<string>(store => reqphase_new_empty())

const remote = store.reg(atomremote)

const api_request = () => {
    let id: Timer

    return reqphase_new_pending<string>({
        promise: new Promise(resolve => {
            id = setTimeout(
                () => {
                    // may resolve with any kind of reqphase emptying state, initiating new request or fulfilling
                    resolve(reqphase_new_fulfilled("Hello World"))
                },
                500
            )
        }),

        abort: () => clearTimeout(id)
    })
}

remote.addsub(() => {
    console.log(
        // extract data from reqphase, use null on fallback, second paramter is set on default
        reqphase_data(remote.output(), () => null)
    )
})

// will pring null
remote.input(api_request())
// will abort previous request
// also will print null again
remote.input(api_request())
// in 0.5 seconds will pring "Hello World"
```

## Atom Selector Remote Data

Utility selector to get data from remotedata

```typescript
const atomremote = atomremote_new<string>(() => reqphase_new_empty())
// second argument is fallback value, it's optional and () => null by default
const atomremote_data = atomselector_new_remotedata(atomremote, () => null)

const remote = store.reg(atomremote)
const remote_data = store.reg(atomremote_data)

remote_data.addsub(() => {
    console.log(remote_data.output())
})

remote.input(reqphase_new_empty())
remote.input(reqphase_new_fulfilled("Hello World"))
remote.input(reqphase_new_empty())
```

## Atom Loader

Connects when requested, disconnected when does not

### Atom Loader Pure

Does not get any paramters
Example with requesting user data

```typescript
const atomstate_id = atomstate_new<number>(() => 0)
const atomremote = atomremote_new<string>(() => reqphase_new_empty())

// fake api request
const api_request_user = function (id: number, signal: AbortSignal): Promise<string> {
    return new Promise((resolve) => {
        let timer: Timer

        const interrupt = () => {
            resolve(reqphase_new_empty())

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
                const promise_wrapped = promise.then(reqphase_new_fulfilled).catch(reqphase_new_empty)

                remote.input(reqphase_new_pending({
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
    console.log(asc.reqphase_data(remote.output()))
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
