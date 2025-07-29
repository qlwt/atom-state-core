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
