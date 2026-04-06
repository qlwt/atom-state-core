import { family_atom_hash } from "#src/family/atom/hash.js";
import { family_atom_search } from "#src/index.js";
import { store_new } from "#src/store/new/index.js";
import { value_atom } from "#src/value/atom/index.js";
import { assert, expect, test } from "vitest";

const hashfamily_atom = family_atom_hash(() => ({
    key: (cachekey: string) => cachekey,

    get: (cachekey) => value_atom(() => ({
        value: Number.parseInt(cachekey)
    })),
}))

type SearchParams = {
    readonly fn: VoidFunction
    readonly value: number
}

const searchfamily_atom = family_atom_search(() => ({
    comparator: (a: SearchParams, b: SearchParams) => a.fn === b.fn && a.value === b.value,

    get: param => {
        return value_atom(() => ({ value: param.value, }))
    }
}))

test("family_hash", () => {
    const outputs: any[] = []
    const expectations: any[] = []

    const store = store_new()
    const family = store.reg(hashfamily_atom)

    expect(family.reg("13")).toBe(family.reg("13"))
    expect(family.has("13")).toBe(true)
    expect(family.reg("13").value).toBe(13)
    expect(family.reg("25").value).toBe(25)

    assert.deepStrictEqual(
        family.entries_signal().output(),
        [
            ["13", { value: 13 }],
            ["25", { value: 25 }]
        ]
    )

    family.set_soft("13", { value: 14 })
    family.set_soft("14", { value: 15 }, {
        cleanup: () => {
            outputs.push(15)
        }
    })

    expect(family.reg("13").value).toBe(13)
    expect(family.reg("14").value).toBe(15)
    assert.deepStrictEqual(outputs, expectations)

    family.set_hard("14", { value: 14 }, {
        cleanup: () => {
            outputs.push(14)
        }
    })

    expectations.push(15)

    expect(family.reg("14").value).toBe(14)
    expect(family.get("14")?.result.value).toBe(14)
    assert.deepStrictEqual(outputs, expectations)

    family.delete("14")
    expectations.push(14)

    assert.deepStrictEqual(outputs, expectations)
    expect(family.get("14")).toBe(null)
})

test("family_search", () => {
    const outputs: any[] = []
    const expectations: any[] = []

    const key_1: SearchParams = { fn: () => { }, value: 13, }
    const key_2: SearchParams = { fn: () => { }, value: 14, }
    const key_3: SearchParams = { fn: () => { }, value: 25, }

    const store = store_new()
    const family = store.reg(searchfamily_atom)

    expect(family.reg(key_1)).toBe(family.reg(key_1))
    expect(family.has(key_1)).toBe(true)
    expect(family.reg(key_1).value).toBe(13)
    expect(family.reg(key_3).value).toBe(25)

    assert.deepStrictEqual(
        family.entries_signal().output(),
        [
            [key_1, { value: 13 }],
            [key_3, { value: 25 }]
        ]
    )

    family.set_soft(key_1, { value: 14 })
    family.set_soft(key_2, { value: 15 }, {
        cleanup: () => {
            outputs.push(15)
        }
    })

    expect(family.reg(key_1).value).toBe(13)
    expect(family.reg(key_2).value).toBe(15)
    assert.deepStrictEqual(outputs, expectations)

    family.set_hard(key_2, { value: 14 }, {
        cleanup: () => {
            outputs.push(14)
        }
    })

    expectations.push(15)

    expect(family.reg(key_2).value).toBe(14)
    expect(family.get(key_2)?.result.value).toBe(14)
    assert.deepStrictEqual(outputs, expectations)

    family.delete(key_2)
    expectations.push(14)

    assert.deepStrictEqual(outputs, expectations)
    expect(family.get(key_2)).toBe(null)
})
