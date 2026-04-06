import { loader_atom_pure } from "#src/loader/atom/pure.js";
import { state_atom } from "#src/state/atom/index.js";
import { store_new } from "#src/store/new/index.js";
import { throttler_new_immediate } from "#src/util/callbatcher/throttler/new/immediate.js";
import { throttler_new_microtask } from "#src/util/callbatcher/throttler/new/microtask.js";
import { expect, test } from "vitest";

test("loader_pure.immediate", () => {
    const atomcounter = state_atom(() => 0)

    const atomloader = loader_atom_pure(({ reg }) => ({
        callbatcher: throttler_new_immediate(),

        connect: () => {
            const counter = reg(atomcounter)

            counter.input(counter.output() + 1)

            return () => {
                counter.input(counter.output() - 1)
            }
        }
    }))

    const atomstore = store_new()
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
    const atomcounter = state_atom(() => 0)

    const atomloader = loader_atom_pure(({ reg }) => ({
        callbatcher: throttler_new_microtask(),

        connect: () => {
            const counter = reg(atomcounter)

            counter.input(counter.output() + 1)

            return () => {
                counter.input(counter.output() - 1)
            }
        }
    }))

    const atomstore = store_new()
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
