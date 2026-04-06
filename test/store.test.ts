import { store_new } from "#src/store/new/index.js";
import { value_atom } from "#src/value/atom/index.js";
import { expect, test, assert } from "vitest";

test("store_general", () => {
    const outputs: any[] = []
    const expectations: any[] = []

    const store = store_new()

    const key_1 = value_atom(() => ({ value: 13 }))
    const key_2 = value_atom(() => ({ value: 14 }))
    const key_3 = value_atom(() => ({ value: 25 }))

    expect(store.reg(key_1)).toBe(store.reg(key_1))
    expect(store.has(key_1)).toBe(true)
    expect(store.reg(key_1).value).toBe(13)
    expect(store.reg(key_3).value).toBe(25)

    assert.deepStrictEqual(
        store.entries_signal().output(),
        [
            [key_1, { value: 13 }],
            [key_3, { value: 25 }]
        ]
    )

    store.set_soft(key_1, { value: 14 })
    store.set_soft(key_2, { value: 15 }, {
        cleanup: () => {
            outputs.push(15)
        }
    })

    expect(store.reg(key_1).value).toBe(13)
    expect(store.reg(key_2).value).toBe(15)
    assert.deepStrictEqual(outputs, expectations)

    store.set_hard(key_2, { value: 14 }, {
        cleanup: () => {
            outputs.push(14)
        }
    })

    expectations.push(15)

    expect(store.reg(key_2).value).toBe(14)
    expect(store.get(key_2)?.result.value).toBe(14)
    assert.deepStrictEqual(outputs, expectations)

    store.delete(key_2)
    expectations.push(14)

    assert.deepStrictEqual(outputs, expectations)
    expect(store.get(key_2)).toBe(null)
})

test("store_interkeyref", () => {
    const store = store_new()

    const key_1 = value_atom(() => {
        return { value: 10 }
    })

    const key_2 = value_atom(store => {
        return store.reg(key_1).value + 10
    })

    expect(store.reg(key_2)).toBe(20)
    expect(store.has(key_1)).toBe(true)
})
