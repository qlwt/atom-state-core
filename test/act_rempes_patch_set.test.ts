import { act_rempes_patch_set } from "#src/act/rempes/patch_set.js";
import { remnode_new, remview_new_node, ReqState_Status, reqstate_data_fulfilled } from "#src/index.js";
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

test("act_rempes_patch_set base", async () => {
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

    act_rempes_patch_set({
        request: {
            promise: wait(20).then(() => patch_1),

            interpret: api => {
                return [
                    {
                        target: remnode,
                        patch: {
                            kind: "flat",
                            data: api.result,
                        }
                    }
                ]
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1 })
    assert.deepStrictEqual(outputs, expectations)

    // resolved
    await wait(22)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), { ...data_1, ...patch_1 })
    assert.deepStrictEqual(outputs, expectations)
})

test("act_rempes_patch_set interrupt", async () => {
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

    act_rempes_patch_set({
        config: {
            signal_abort: controller_abort.signal,
        },

        request: {
            promise: wait(20).then(() => patch_1),

            interpret: api => {
                return [
                    {
                        target: remnode,
                        patch: {
                            kind: "flat",
                            data: api.result,
                        }
                    }
                ]
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1 })
    assert.deepStrictEqual(outputs, expectations)

    // nothing
    await wait(12)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1 })
    assert.deepStrictEqual(outputs, expectations)

    controller_abort.abort()

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(remview.output().data, { ...data_1 })
    assert.deepStrictEqual(outputs, expectations)

    // nothing
    await wait(20)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), { ...data_1 })
    assert.deepStrictEqual(outputs, expectations)
})
