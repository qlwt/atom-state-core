import { object_deepmerge } from "#src/util/object/deepmerge.js"
import { expect, assert, test } from "vitest"

test("object_deepmerge baseline", () => {
    const a = {
        name: "a:name",
        value: 5,

        child: {
            name: "a:child:name"
        },

        config: {
            print: true,
        },
    }

    const b = {
        name: "b:name",

        child: {
            value: 5,
        },
    }

    const ab = object_deepmerge(a, b)

    assert.deepStrictEqual(a, {
        ...a,

        child: {
            ...a.child,
        },

        config: {
            ...a.config,
        },
    })

    assert.deepStrictEqual(b, {
        ...b,

        child: {
            ...b.child,
        },
    })

    assert.deepStrictEqual(ab, {
        name: b.name,
        value: a.value,

        child: {
            name: a.child.name,
            value: b.child.value,
        },

        config: {
            print: a.config.print
        },
    })

    expect(a.child === ab.child).toBe(false)
    expect(a.config === ab.config).toBe(true)
})
