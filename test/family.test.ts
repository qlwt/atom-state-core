import { atomfamily_new } from "#src/atom/family/new/index.js";
import { atomstore_new } from "#src/atom/store/new/index.js";
import { atomvalue_new } from "#src/atom/value/new/index.js";
import { expect, test } from "vitest";

const atomfamily = atomfamily_new({
    key: (cachekey: string) => cachekey,

    get: (cachekey) => atomvalue_new(() => ({
        value: Number.parseInt(cachekey)
    })),
})

test("family", () => {
    const store = atomstore_new()
    const family = store.reg(atomfamily)

    expect(family.reg("13")).toBe(family.reg("13"))
    expect(family.has("13")).toBe(true)
    expect(family.reg("13").value).toBe(13)
    expect(family.reg("25").value).toBe(25)
})
