import { throttler_new_delay } from "#src/util/callbatcher/throttler/new/delay.js";
import { throttler_new_microtask } from "#src/util/callbatcher/throttler/new/microtask.js";
import { assert, test, expect } from "vitest";

test("throttler_microtask", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const throttler = throttler_new_microtask()

    expect(throttler.status_scheduled_new()).toBe(false)

    throttler.emit(() => {
        outputs.push(0)
    })

    expect(throttler.status_scheduled_new()).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    await Promise.resolve()

    expectations.push(0)

    expect(throttler.status_scheduled_new()).toBe(false)
    assert.deepStrictEqual(outputs, expectations)

    throttler.emit(() => {
        outputs.push(-1)
    })

    throttler.emit(() => {
        outputs.push(1)
    })

    assert.deepStrictEqual(outputs, expectations)

    await Promise.resolve()

    expectations.push(1)

    assert.deepStrictEqual(outputs, expectations)
})

const wait = function(delay: number) {
    return new Promise(res => setTimeout(res, delay))
}

test("throttler_delay", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const throttler = throttler_new_delay(50)

    expect(throttler.status_scheduled_new()).toBe(false)

    throttler.emit(() => {
        outputs.push(0)
    })

    expect(throttler.status_scheduled_new()).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    await wait(25)

    assert.deepStrictEqual(outputs, expectations)

    await wait(30)

    expectations.push(0)

    expect(throttler.status_scheduled_new()).toBe(false)
    assert.deepStrictEqual(outputs, expectations)

    throttler.emit(() => {
        outputs.push(-1)
    })

    assert.deepStrictEqual(outputs, expectations)

    await wait(25)

    throttler.emit(() => {
        outputs.push(1)
    })

    assert.deepStrictEqual(outputs, expectations)

    await wait(30)

    expectations.push(1)

    assert.deepStrictEqual(outputs, expectations)
})
