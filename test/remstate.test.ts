import { atomremstate_new } from "#src/remstate/atom/index.js";
import { atomstore_new } from "#src/store/new/index.js";
import { reqstate_new_empty } from "#src/reqstate/new/empty.js";
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js";
import { reqstate_new_pending } from "#src/reqstate/new/pending.js";
import { ReqState__Status, type ReqState } from "#src/reqstate/type/State.js";
import { expect, test } from "vitest";

const atomremote = atomremstate_new<string, ReqState<string>, any>(() => reqstate_new_empty())

const delay = (time: number, next: ReqState<string>) => {
    return new Promise<ReqState<string>>(resolve => {
        setTimeout(() => {
            resolve(next)
        }, time)
    })
}

test("remote", async () => {
    const store = atomstore_new()
    const remote = store.reg(atomremote)

    const aborts = new Array<string>()

    const promise1 = delay(50, reqstate_new_fulfilled("promise1"))
    const promise2 = delay(50, reqstate_new_fulfilled("promise2"))
    const promise3 = delay(100, reqstate_new_fulfilled("promise3"))
    const promise4 = delay(50, reqstate_new_pending({
        request_abort: () => { aborts.push("4") },
        request_promise: promise3,
        request_interpret: result => result,

        optimistic: null,
        meta: null,
        fallback: null,
    }))

    remote.input(reqstate_new_pending({
        request_abort: () => { aborts.push("1") },
        request_promise: promise1,
        request_interpret: result => result,

        optimistic: null,
        meta: null,
        fallback: null,
    }))

    // should interrupt previous promise
    remote.input(reqstate_new_pending({
        request_abort: () => { aborts.push("2") },
        request_promise: promise2,
        request_interpret: result => result,

        optimistic: null,
        meta: null,
        fallback: null,
    }))

    {
        await promise2
    }

    expect(remote.output()).toEqual(reqstate_new_fulfilled("promise2"))

    remote.input(reqstate_new_pending({
        request_abort: () => { aborts.push("4") },
        request_promise: promise4,
        request_interpret: result => result,

        optimistic: null,
        meta: null,
        fallback: null,
    }))

    {
        await promise4
    }

    expect(remote.output().status).toBe(ReqState__Status.Pending)

    {
        await promise3
    }

    expect(remote.output()).toEqual(reqstate_new_fulfilled("promise3"))
    expect(aborts).toEqual(["1"])
})
