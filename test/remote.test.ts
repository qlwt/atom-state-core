import { atomremote_new } from "#src/atom/remote/new/index.js";
import { atomstore_new } from "#src/atom/store/new/index.js";
import { reqphase_new_empty } from "#src/request-phase/new/empty.js";
import { reqphase_new_fulfilled } from "#src/request-phase/new/fulfilled.js";
import { reqphase_new_pending } from "#src/request-phase/new/pending.js";
import { RequestPhase_Status, type RequestPhase } from "#src/request-phase/type/RequestPhase.js";
import { expect, test } from "vitest";

const atomremote = atomremote_new<string>(() => reqphase_new_empty())

const delay = (time: number, next: RequestPhase<string>) => {
    return new Promise<RequestPhase<string>>(resolve => {
        setTimeout(() => {
            resolve(next)
        }, time)
    })
}

test("remote", async () => {
    const store = atomstore_new()
    const remote = store.reg(atomremote)

    const aborts = new Array<string>()

    const promise1 = delay(50, reqphase_new_fulfilled("promise1"))
    const promise2 = delay(50, reqphase_new_fulfilled("promise2"))
    const promise3 = delay(100, reqphase_new_fulfilled("promise3"))
    const promise4 = delay(50, reqphase_new_pending({
        abort: () => { aborts.push("4") },
        promise: promise3
    }))

    remote.input(reqphase_new_pending({
        abort: () => {
            aborts.push("1")
        },
        promise: promise1
    }))

    // should interrupt previous promise
    remote.input(reqphase_new_pending({
        abort: () => {
            aborts.push("2")
        },

        promise: promise2
    }))

    {
        await promise2
    }

    expect(remote.output()).toEqual(reqphase_new_fulfilled("promise2"))

    remote.input(reqphase_new_pending({
        promise: promise4,
        abort: () => { aborts.push("4") },
    }))

    {
        await promise4
    }

    expect(remote.output().status).toBe(RequestPhase_Status.Pending)

    {
        await promise3
    }

    expect(remote.output()).toEqual(reqphase_new_fulfilled("promise3"))
    expect(aborts).toEqual(["1"])
})
