import { debouncer_new_delay } from "#src/util/callbatcher/debouncer/new/delay.js";
import { debouncer_new_microtask } from "#src/util/callbatcher/debouncer/new/microtask.js";
import { assert, test, expect } from "vitest";

test("debouncer_microtask", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const debouncer = debouncer_new_microtask()

    expect(debouncer.status_scheduled_new()).toBe(false)

    debouncer.emit(() => {
        outputs.push(0)
    })

    expect(debouncer.status_scheduled_new()).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    await Promise.resolve()

    expectations.push(0)

    expect(debouncer.status_scheduled_new()).toBe(false)
    assert.deepStrictEqual(outputs, expectations)

    debouncer.emit(() => {
        outputs.push(-1)
    })

    debouncer.emit(() => {
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

test("debouncer_delay", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const debouncer = debouncer_new_delay(50)

    expect(debouncer.status_scheduled_new()).toBe(false)

    debouncer.emit(() => {
        outputs.push(0)
    })

    expect(debouncer.status_scheduled_new()).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    await wait(25)

    assert.deepStrictEqual(outputs, expectations)

    await wait(30)

    expectations.push(0)

    expect(debouncer.status_scheduled_new()).toBe(false)
    assert.deepStrictEqual(outputs, expectations)

    debouncer.emit(() => {
        outputs.push(-1)
    })

    assert.deepStrictEqual(outputs, expectations)

    await wait(25)

    debouncer.emit(() => {
        outputs.push(1)
    })

    assert.deepStrictEqual(outputs, expectations)

    await wait(30)

    assert.deepStrictEqual(outputs, expectations)

    await wait(25)

    expectations.push(1)

    assert.deepStrictEqual(outputs, expectations)
})
