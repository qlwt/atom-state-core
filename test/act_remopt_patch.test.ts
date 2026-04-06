import { act_remopt_patch } from "#src/act/remopt/patch.js";
import { remnode_new, remview_new_node, ReqState_Status, reqstate_data_fulfilled, reqstate_new_empty, throttler_new_delay } from "#src/index.js";
import { assert, expect, test } from "vitest";

const wait = function(delay: number) {
    return new Promise(res => {
        setTimeout(res, delay)
    })
}

// const ofpending = <Data, Result>(
//     reqstate: ReqState<Data>, map: (pending: ReqState_Pending<Data>) => Result
// ): Result | null => {
//     if (reqstate.status === ReqState__Status.Pending) {
//         return map(reqstate)
//     }
//
//     return null
// }
//
// const ofempty = <Data, Result>(
//     reqstate: ReqState<Data>, map: (pending: ReqState_Empty) => Result
// ): Result | null => {
//     if (reqstate.status === ReqState__Status.Empty) {
//         return map(reqstate)
//     }
//
//     return null
// }
//
// const offull = <Data, Result>(
//     reqstate: ReqState<Data>, map: (pending: ReqState_Fulfilled<Data>) => Result
// ): Result | null => {
//     if (reqstate.status === ReqState__Status.Fulfilled) {
//         return map(reqstate)
//     }
//
//     return null
// }

type Def = {
    data: {
        id: number
        name: string
        value: number
        price: number
    }

    statics: {
        id: number
    }

    request_meta: any
    request_result: any
}

test("act_remopt_patch base", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const patch_1 = {
        value: 1,
    }

    const remnode = remnode_new<Def>({
        init: data_1,

        statics: {
            id: 0
        }
    })

    const remview = remview_new_node(remnode)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, data_1)

    act_remopt_patch({
        name: "main",
        target: remnode,

        config: {
            callbatcher: throttler_new_delay(20),
        },

        optimistic: {
            kind: "flat",
            merge: true,
            patch: patch_1,
        },

        request: {
            interpret: api => {
                return api.data_patched()
            },

            init: r_params => {
                outputs.push(r_params.patch?.data)

                return wait(20).then(() => { })
            }
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)

    // moved to active
    await wait(22)

    expectations.push(patch_1)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)

    // resolved
    await wait(22)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    expect(remnode.optimistic.entries_signal().output().length).toBe(0)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)
})

test("act_remopt_patch merge", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const patch_1 = {
        value: 1,
    }

    const patch_2 = {
        price: 1,
    }

    const remnode = remnode_new<Def>({
        init: data_1,

        statics: {
            id: 0
        }
    })

    const remview = remview_new_node(remnode)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, data_1)

    act_remopt_patch({
        name: "main",
        target: remnode,

        config: {
            callbatcher: throttler_new_delay(20),
        },

        optimistic: {
            kind: "flat",
            merge: true,
            patch: patch_1,
        },

        request: {
            interpret: api => {
                return api.data_patched()
            },

            init: () => wait(20).then(() => { })
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)

    act_remopt_patch({
        name: "main",
        target: remnode,

        config: {
            callbatcher: throttler_new_delay(20),
        },

        optimistic: {
            kind: "flat",
            merge: true,
            patch: patch_2,
        },

        request: {
            interpret: api => {
                return api.data_patched()
            },

            init: r_params => {
                outputs.push(r_params.patch?.data)

                return wait(20).then(() => { })
            }
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1, ...patch_2 })
    assert.deepStrictEqual(outputs, expectations)

    // moved to active
    await wait(22)

    expectations.push({ ...patch_1, ...patch_2 })

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1, ...patch_2 })
    assert.deepStrictEqual(outputs, expectations)

    // resolved
    await wait(22)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    expect(remnode.optimistic.entries_signal().output().length).toBe(0)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), { ...data_1, ...patch_1, ...patch_2 })
    assert.deepStrictEqual(outputs, expectations)
})

test("act_remopt_patch deps", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const patch_1 = {
        value: 1,
    }

    const remnode = remnode_new<Def>({
        init: data_1,

        statics: {
            id: 0
        }
    })

    remnode.real.input({
        status: ReqState_Status.Pending,

        fallback: null,
        meta: null,
        optimistic: { value: data_1 },
        request_promise: wait(500).then(() => data_1),
        request_abort: () => { },
        request_interpret: () => reqstate_new_empty({}),
    })

    const remview = remview_new_node(remnode)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(remview.output().data, data_1)

    act_remopt_patch({
        name: "main",
        target: remnode,

        config: {
            callbatcher: throttler_new_delay(20),
        },

        optimistic: {
            kind: "flat",
            merge: true,
            patch: patch_1,
        },

        request: {
            interpret: api => {
                return api.data_patched()
            },

            init: r_params => {
                outputs.push(r_params.patch?.data)

                return wait(20).then(() => { })
            }
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)

    // request is moved to active
    // but promise is not initiated yet
    await wait(50)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)

    remnode.real.input({
        status: ReqState_Status.Fulfilled,
        data: data_1,
    })

    expectations.push({ ...patch_1 })

    // promise initiated
    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)

    // invoked
    await wait(22)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    expect(remnode.optimistic.entries_signal().output().length).toBe(0)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)
})

test("act_remopt_patch interrupt", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()
    
    const controller_abort = new AbortController()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const patch_1 = {
        value: 1,
    }

    const remnode = remnode_new<Def>({
        init: data_1,

        statics: {
            id: 0
        }
    })

    const remview = remview_new_node(remnode)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, data_1)

    act_remopt_patch({
        name: "main",
        target: remnode,

        config: {
            callbatcher: throttler_new_delay(20),
            signal_abort: controller_abort.signal,
        },

        optimistic: {
            kind: "flat",
            merge: true,
            patch: patch_1,
        },

        request: {
            interpret: api => {
                return api.data_patched()
            },

            init: r_params => {
                outputs.push(r_params.patch?.data)

                return wait(20).then(() => { 
                    if (r_params.signal_abort.aborted) { return }

                    outputs.push(r_params.patch?.data)
                })
            }
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)

    // moved to active
    await wait(22)

    expectations.push(patch_1)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)

    controller_abort.abort()

    expect(remnode.optimistic.entries_signal().output().length).toBe(0)
    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1 })
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(50)

    expect(remnode.optimistic.entries_signal().output().length).toBe(0)
    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1 })
    assert.deepStrictEqual(outputs, expectations)
})
