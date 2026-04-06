import { loader_atom_concurrent } from "#src/loader/atom/concurrent.js";
import { state_atom } from "#src/state/atom/index.js";
import { store_new } from "#src/store/new/index.js";
import { throttler_new_immediate } from "#src/util/callbatcher/throttler/new/immediate.js";
import { throttler_new_microtask } from "#src/util/callbatcher/throttler/new/microtask.js";
import { expect, test } from "vitest";

test("loader_concurrent.immediate", () => {
    const atomcounter = state_atom<number[]>(() => [])

    const atomloader = loader_atom_concurrent<number>(({ reg }) => ({
        callbatcher: throttler_new_immediate(),

        comparator: (a, b) => {
            return a - b
        },

        connect: num => {
            const counter = reg(atomcounter)

            counter.input([...counter.output(), num])

            return () => {
                counter.input(counter.output().slice(0, -1))
            }
        }
    }))

    const atomstore = store_new()
    const loader = atomstore.reg(atomloader)
    const counter = atomstore.reg(atomcounter)

    {
        const cancel1 = loader.request(5)

        expect(counter.output()[0]).toBe(5)

        const cancel2 = loader.request(3)

        expect(counter.output()[0]).toBe(5)

        cancel1()

        expect(counter.output()[0]).toBe(3)

        cancel2()

        expect(counter.output()[0]).toBe(undefined)
    }
})

test("loader_concurrent.throttler", async () => {
    const atomcounter = state_atom<number[]>(() => [])

    const atomloader = loader_atom_concurrent<number>(({ reg }) => ({
        callbatcher: throttler_new_microtask(),

        comparator: (a, b) => {
            return a - b
        },

        connect: num => {
            const counter = reg(atomcounter)

            counter.input([...counter.output(), num])

            return () => {
                counter.input(counter.output().slice(0, -1))
            }
        }
    }))

    const atomstore = store_new()
    const loader = atomstore.reg(atomloader)
    const counter = atomstore.reg(atomcounter)

    {
        const cancel5 = loader.request(5)

        expect(counter.output()[0]).toBe(undefined)

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(5)

        const cancel3 = loader.request(3)

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(5)

        cancel3()

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(5)

        cancel5()

        expect(counter.output()[0]).toBe(5)

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(undefined)
    }

    {
        expect(counter.output()[0]).toBe(undefined)

        const cancel5 = loader.request(5)
        const cancel7 = loader.request(7)
        const cancel9 = loader.request(9)

        expect(counter.output()[0]).toBe(undefined)

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(9)

        cancel7()
        cancel9()

        expect(counter.output()[0]).toBe(9)

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(5)

        cancel5()

        expect(counter.output()[0]).toBe(5)

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(undefined)
    }

    {
        expect(counter.output()[0]).toBe(undefined)

        loader.request(5)()

        expect(counter.output()[0]).toBe(undefined)

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(undefined)
    }

    {
        expect(counter.output()[0]).toBe(undefined)

        const cancel5 = loader.request(5)
        const cancel7 = loader.request(7)

        cancel7()
        cancel5()

        expect(counter.output()[0]).toBe(undefined)

        { await Promise.resolve().then(() => {}) }

        expect(counter.output()[0]).toBe(undefined)
    }
})
