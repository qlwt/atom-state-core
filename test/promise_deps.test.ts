import { promise_new_remdeps, remnode_new, ReqState_Status, reqstate_new_fulfilled } from "#src/index.js";
import { assert, test } from "vitest";

const wait = function(time: number) {
    return new Promise(res => setTimeout(res, time))
}

test("promise_deps", async () => {
    const outputs = new Array()
    const expectations = new Array()

    const remnode_a = remnode_new({ init: null, statics: {} })
    const remnode_b = remnode_new({ init: null, statics: {} })
    const remnode_c = remnode_new({ init: null, statics: {} })

    remnode_a.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e5),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    remnode_b.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e5),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    remnode_c.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e5),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    promise_new_remdeps({
        deps: [remnode_a, remnode_b, remnode_c],

        request_new: (l_params) => {
            return Promise.resolve().then(() => {
                if (!l_params.signal_abort.aborted) {
                    outputs.push(0)
                }
            })
        },
    })

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)

    remnode_a.real.input({
        status: ReqState_Status.Fulfilled,
        data: {}
    })

    remnode_b.real.input({
        status: ReqState_Status.Fulfilled,
        data: {}
    })

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)

    remnode_c.real.input({
        status: ReqState_Status.Fulfilled,
        data: {}
    })

    await wait(10)

    expectations.push(0)

    assert.deepStrictEqual(outputs, expectations)
})

test("promise_deps throw", async () => {
    const outputs = new Array()
    const expectations = new Array()

    const remnode_a = remnode_new({ init: null, statics: {} })
    const remnode_b = remnode_new({ init: null, statics: {} })
    const remnode_c = remnode_new({ init: null, statics: {} })

    remnode_a.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    remnode_b.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    remnode_c.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    promise_new_remdeps({
        deps: [remnode_a, remnode_b, remnode_c],

        request_new: (l_params) => {
            return Promise.resolve().then(() => {
                if (!l_params.signal_abort.aborted) {
                    outputs.push(0)
                }
            })
        },
    }).catch(() => outputs.push("ERROR"))

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)

    remnode_a.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })

    remnode_b.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)

    remnode_c.real.input({
        status: ReqState_Status.Empty,
        error: null,
    })

    expectations.push("ERROR")

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)
})

test("promise_deps interrupt", async () => {
    const outputs = new Array()
    const expectations = new Array()

    const remnode_a = remnode_new({ init: null, statics: {} })
    const remnode_b = remnode_new({ init: null, statics: {} })
    const remnode_c = remnode_new({ init: null, statics: {} })

    remnode_a.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    remnode_b.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    remnode_c.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    promise_new_remdeps({
        deps: [remnode_a, remnode_b, remnode_c],

        request_new: (l_params) => {
            return wait(20).then(() => {
                if (!l_params.signal_abort.aborted) {
                    outputs.push(0)
                }
            })
        },
    }).catch(() => outputs.push("ERROR"))

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)

    remnode_a.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })
    remnode_b.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })
    remnode_c.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)

    remnode_c.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    assert.deepStrictEqual(outputs, expectations)

    await wait(30)

    assert.deepStrictEqual(outputs, expectations)

    remnode_c.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })

    await wait(30)

    expectations.push(0)

    assert.deepStrictEqual(outputs, expectations)
})

test("promise_deps abort", async () => {
    const outputs = new Array()
    const expectations = new Array()

    const remnode_a = remnode_new({ init: null, statics: {} })
    const remnode_b = remnode_new({ init: null, statics: {} })
    const remnode_c = remnode_new({ init: null, statics: {} })

    remnode_a.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    remnode_b.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    remnode_c.real.input({
        status: ReqState_Status.Pending,

        meta: null,
        fallback: null,
        optimistic: { value: {} },
        request_promise: wait(1e3),

        request_abort: () => { },
        request_interpret: () => (reqstate_new_fulfilled({})),
    })

    const controller_abort = new AbortController()

    const promise = promise_new_remdeps({
        deps: [remnode_a, remnode_b, remnode_c],
        signal_abort: controller_abort.signal,

        request_new: (l_params) => {
            return wait(20).then(() => {
                if (!l_params.signal_abort.aborted) {
                    outputs.push(0)
                }
            })
        },
    })

    promise.catch(() => outputs.push("ERROR"))

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)

    remnode_a.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })
    remnode_b.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })
    remnode_c.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })

    await wait(10)

    assert.deepStrictEqual(outputs, expectations)

    controller_abort.abort()

    assert.deepStrictEqual(outputs, expectations)

    await wait(30)

    // will throw error on abortion
    expectations.push("ERROR")

    assert.deepStrictEqual(outputs, expectations)

    remnode_c.real.input({
        status: ReqState_Status.Fulfilled,
        data: {},
    })

    await wait(30)

    assert.deepStrictEqual(outputs, expectations)
})
