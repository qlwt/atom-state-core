import { act_remopt_request_set } from "#src/act/remopt/request_set.js";
import { remnode_new, ReqState_Status, reqstate_data_fulfilled, reqstate_new_fulfilled, type ReqState, type ReqState_Pending } from "#src/index.js";
import { assert, expect, test } from "vitest";

const wait = function(delay: number) {
    return new Promise(res => {
        setTimeout(res, delay)
    })
}

const ofpending = <Data, Result>(
    reqstate: ReqState<Data>, map: (pending: ReqState_Pending<Data>) => Result
): Result | null => {
    if (reqstate.status === ReqState_Status.Pending) {
        return map(reqstate)
    }

    return null
}

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

test("act_remopt_request_set base", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const remnode = remnode_new<Def>({
        init: null,

        statics: {
            id: 0
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)

    act_remopt_request_set({
        target: remnode,

        request: {
            meta: {},
            promise: wait(20).then(() => data_1),

                interpret: api => {
                return {
                    kind: "success",
                    reqstate: reqstate_new_fulfilled(api.result)
                }
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(12)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    // resolved
    await wait(12)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), data_1)
    assert.deepStrictEqual(outputs, expectations)
})

test("act_remopt_request_set override", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const remnode = remnode_new<Def>({
        init: null,

        statics: {
            id: 0
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)

    act_remopt_request_set({
        target: remnode,

        request: {
            meta: {},
            promise: wait(20).then(() => data_1),

                interpret: api => {
                return {
                    kind: "success",
                    reqstate: reqstate_new_fulfilled(api.result)
                }
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(10)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    // replaces old one
    act_remopt_request_set({
        target: remnode,

        request: {
            meta: {},
            promise: wait(20).then(() => data_1),

                interpret: api => {
                return {
                    kind: "success",
                    reqstate: reqstate_new_fulfilled(api.result)
                }
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(10)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    // resolve
    await wait(15)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), data_1)
    assert.deepStrictEqual(outputs, expectations)
})

test("act_remopt_request_set interrupt", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const remnode = remnode_new<Def>({
        init: null,

        statics: {
            id: 0
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)

    act_remopt_request_set({
        target: remnode,

        request: {
            meta: {},

            promise: wait(20).then(() => data_1),

                interpret: api => {
                return {
                    kind: "success",
                    reqstate: reqstate_new_fulfilled(api.result)
                }
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(10)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    {
        const real_o = remnode.real.output()

        if (real_o.status === ReqState_Status.Pending) {
            real_o.request_abort()
        }
    }

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(30)

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)
    assert.deepStrictEqual(outputs, expectations)
})

test("act_remopt_request_set interrupt fallback", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const data_2 = {
        id: 0,
        name: "name_1",
        value: 1,
        price: 1,
    }

    const remnode = remnode_new<Def>({
        init: data_2,

        statics: {
            id: 0
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), data_2)

    act_remopt_request_set({
        target: remnode,

        fallback: {
            value: true,
        },

        request: {
            meta: {},
            promise: wait(20).then(() => data_1),

                interpret: api => {
                return {
                    kind: "success",
                    reqstate: reqstate_new_fulfilled(api.result)
                }
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(ofpending(remnode.real.output(), p => p.fallback?.value ?? null), data_2)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(10)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(ofpending(remnode.real.output(), p => p.fallback?.value ?? null), data_2)
    assert.deepStrictEqual(outputs, expectations)

    {
        const real_o = remnode.real.output()

        if (real_o.status === ReqState_Status.Pending) {
            real_o.request_abort()
        }
    }

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), data_2)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(30)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(outputs, expectations)
})

test("act_remopt_request_set optimisitc", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const remnode = remnode_new<Def>({
        init: null,

        statics: {
            id: 0
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)

    act_remopt_request_set({
        target: remnode,

        optimistic: {
            value: data_1,
        },

        request: {
            meta: {},
            promise: wait(20).then(() => data_1),

                interpret: api => {
                return {
                    kind: "success",
                    reqstate: reqstate_new_fulfilled(api.result)
                }
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(ofpending(remnode.real.output(), p => p.optimistic?.value), data_1)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(10)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(ofpending(remnode.real.output(), p => p.optimistic?.value), data_1)
    assert.deepStrictEqual(outputs, expectations)

    // resolved
    await wait(20)

    expect(remnode.real.output().status).toBe(ReqState_Status.Fulfilled)
    assert.deepStrictEqual(reqstate_data_fulfilled(remnode.real.output()), data_1)
    assert.deepStrictEqual(outputs, expectations)
})

test("act_remopt_request_set interrupt", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const controller_abort = new AbortController()

    const data_1 = {
        id: 0,
        name: "name",
        value: 0,
        price: 0,
    }

    const remnode = remnode_new<Def>({
        init: null,

        statics: {
            id: 0
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)

    act_remopt_request_set({
        target: remnode,

        config: {
            signal_abort: controller_abort.signal,
        },

        request: {
            meta: {},
            promise: wait(20).then(() => data_1),

                interpret: api => {
                return {
                    kind: "success",
                    reqstate: reqstate_new_fulfilled(api.result)
                }
            },
        }
    })

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(12)

    expect(remnode.real.output().status).toBe(ReqState_Status.Pending)
    assert.deepStrictEqual(outputs, expectations)

    controller_abort.abort()

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(20)

    expect(remnode.real.output().status).toBe(ReqState_Status.Empty)
    assert.deepStrictEqual(outputs, expectations)
})
