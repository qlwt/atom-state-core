import { atomloader_new_pure } from "#src/loader/atom/pure.js";
import { atomstate_new } from "#src/state/atom/index.js";
import { atomstore_new } from "#src/store/new/index.js";
import { throttler_new_immediate } from "#src/throttler/new/immediate.js";
import { throttler_new_microtask } from "#src/throttler/new/microtask.js";
import { expect, test } from "vitest";

test("loader_pure.immediate", () => {
    const atomcounter = atomstate_new(() => 0)

    const atomloader = atomloader_new_pure({
        throttler: throttler_new_immediate(),

        connect: store => {
            const counter = store.reg(atomcounter)

            counter.input(counter.output() + 1)

            return () => {
                counter.input(counter.output() - 1)
            }
        }
    })

    const atomstore = atomstore_new()
    const loader = atomstore.reg(atomloader)
    const counter = atomstore.reg(atomcounter)

    {
        const cancel = loader.request()

        expect(counter.output()).toBe(1)

        cancel()

        expect(counter.output()).toBe(0)
    }
})

test("loader_pure.throttler", async () => {
    const atomcounter = atomstate_new(() => 0)

    const atomloader = atomloader_new_pure({
        throttler: throttler_new_microtask(),

        connect: store => {
            const counter = store.reg(atomcounter)

            counter.input(counter.output() + 1)

            return () => {
                counter.input(counter.output() - 1)
            }
        }
    })

    const atomstore = atomstore_new()
    const loader = atomstore.reg(atomloader)
    const counter = atomstore.reg(atomcounter)

    {
        const cancel = loader.request()

        expect(counter.output()).toBe(0)

        { await Promise.resolve().then(() => { }) }

        expect(counter.output()).toBe(1)

        cancel()

        expect(counter.output()).toBe(1)

        { await Promise.resolve().then(() => { }) }

        expect(counter.output()).toBe(0)
    }

    {
        loader.request()()

        expect(counter.output()).toBe(0)

        { await Promise.resolve().then(() => { }) }

        expect(counter.output()).toBe(0)
    }

    {
        const cancel = loader.request()

        expect(counter.output()).toBe(0)

        { await Promise.resolve().then(() => { }) }

        expect(counter.output()).toBe(1)

        cancel()
        loader.request()

        { await Promise.resolve().then(() => { }) }

        expect(counter.output()).toBe(1)
    }
})
