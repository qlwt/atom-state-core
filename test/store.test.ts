import { atomstore_new } from "#src/store/new/index.js";
import { atomvalue_new } from "#src/value/atom/index.js";
import { expect, test } from "vitest";

const value_1 = atomvalue_new(() => {
    return { value: 10 }
})

const value_2 = atomvalue_new(store => {
    return store.reg(value_1).value + 10
})

test("store", () => {
    const store_1 = atomstore_new()
    const store_2 = atomstore_new()

    expect(store_1.reg(value_1)).toBe(store_1.reg(value_1))
    expect(store_1.reg(value_2)).toBe(20)
    expect(store_2.reg(value_2)).toBe(20)
    expect(store_2.has(value_1)).toBe(true)
})
