import { debouncer_new_delay, throttler_new_delay } from "#src/index.js"
import { remopt_new } from "#src/remopt/new/index.js"
import { test, expect, assert } from "vitest"

type Data = {
    readonly name: string
    readonly value: number
}

const wait = (delay: number) => {
    return new Promise(res => {
        setTimeout(res, delay)
    })
}

test("remopt baseline", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                }
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(patch?.data)
                }),
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // nothing changed
    await wait(30)

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // scheduled moved to active
    await wait(30)

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // promise invoked
    await wait(30)

    expectations.push({ value: 0 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt hook_then", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input<Partial<Data>, Partial<Data>>({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(10),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => data as Partial<Data>),

                hook_then: response => {
                    outputs.push(response)
                },
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // invoked
    await wait(40)

    expectations.push({ value: 0 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt hook_after", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input<Partial<Data>, Partial<Data>>({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(10),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => data as Partial<Data>),

                hook_then: response => {
                    outputs.push(response)
                },

                hook_after: promise => {
                    promise.then(() => {
                        outputs.push({ value: 1 })
                    })
                },
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // invoked
    await wait(40)

    expectations.push({ value: 0 })
    expectations.push({ value: 1 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt override", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // nothing changed
    await wait(30)

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: (params) => {
            if (params.scheduled && typeof params.scheduled === "object") {
                return {
                    applicator: Object.assign,

                    data: {
                        ...params.scheduled.data as any,

                        name: "success",
                    },
                }
            }

            return {
                applicator: Object.assign,

                data: {
                    name: "no_previous_data_provided",
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // previous one is interrupted but nothing changed
    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // scheduled moved to active
    await wait(30)

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // promise invoked
    await wait(30)

    expectations.push({ value: 0, name: "success" })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt schedule", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // moved to active
    // not yet invoked
    await wait(60)

    expect(remopt.output()?.request_scheduled).toBe(null)
    expect(remopt.output()?.request_active.length).toBe(1)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 1,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    expect(!!remopt.output()?.request_scheduled).toBe(true)
    expect(remopt.output()?.request_active.length).toBe(1)
    assert.deepStrictEqual(outputs, expectations)

    // first callback invoked
    // schedule is throttled
    await wait(20)

    expectations.push({ value: 0 })

    expect(!!remopt.output()?.request_scheduled).toBe(true)
    expect(remopt.output()?.request_active.length).toBe(0)
    assert.deepStrictEqual(outputs, expectations)

    // second callback moved to active
    await wait(50)

    expect(remopt.output()?.request_scheduled).toBe(null)
    expect(remopt.output()?.request_active.length).toBe(1)
    assert.deepStrictEqual(outputs, expectations)

    // second promise invoked
    await wait(30)

    expectations.push({ value: 1 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt instant", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: true,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to active immediately
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // promise invoked
    await wait(30)

    expectations.push({ value: 0 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt schedule instant", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: true,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to active immediately
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 1,
                },
            }
        },

        config: {
            force: false,
            instant: true,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to schedule
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // first promise invoked
    // second is moved to active immediately
    await wait(30)

    expectations.push({ value: 0 })

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // second promise invoked
    await wait(30)

    expectations.push({ value: 1 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt schedule force", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",
        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: true,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(100).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to active immediately
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",
        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 1,
                },
            }
        },

        config: {
            force: true,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to schedule
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // second callback is activated
    await wait(60)

    expect(remopt.output()?.request_active.length).toBe(2)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // second promise invoked
    await wait(30)

    expectations.push({ value: 1 })

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // first promise invoked
    await wait(20)

    expectations.push({ value: 0 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt schedule force instant", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: true,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(40).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to active immediately
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 1,
                },
            }
        },

        config: {
            force: true,
            instant: true,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // activated immediately
    expect(remopt.output()?.request_active.length).toBe(2)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // second promise invoked
    await wait(30)

    expectations.push({ value: 1 })

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    await wait(20)

    expectations.push({ value: 0 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt force natural-evaluation", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        callbatcher: debouncer_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: true,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to active immediately
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 1,
                },
            }
        },

        config: {
            force: true,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to schedule
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // first promise invoked
    // second is waiting for callback
    await wait(30)

    expectations.push({ value: 0 })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // second request moved to active
    await wait(30)

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // second promise invoked
    await wait(20)

    expectations.push({ value: 1 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt no-config", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to active immediately
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 1,
                },
            }
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    // moved to schedule
    expect(remopt.output()?.request_active.length).toBe(1)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // first promise invoked
    // second is moved to active immediately
    await wait(30)

    expectations.push({ value: 0 })

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // second promise invoked
    await wait(30)

    expectations.push({ value: 1 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt schedule", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // moved to active
    // not yet invoked
    await wait(60)

    expect(remopt.output()?.request_scheduled).toBe(null)
    expect(remopt.output()?.request_active.length).toBe(1)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(50),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 1,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    expect(!!remopt.output()?.request_scheduled).toBe(true)
    expect(remopt.output()?.request_active.length).toBe(1)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "clear",
    })

    expect(remopt.output()).toBe(null)

    // everything is aborted
    await wait(80)

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt interrupt-schedule", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})
    const controller_abort = new AbortController()

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(30),
        signal_abort: controller_abort.signal,

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // nothing changed
    await wait(20)

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    controller_abort.abort()

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(50)

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})

test("remopt interrupt-active", async () => {
    const outputs = new Array<any>()
    const expectations = new Array<any>()

    const remopt = remopt_new<Partial<Data>>({})
    const controller_abort = new AbortController()

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(30),
        signal_abort: controller_abort.signal,

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 0,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // pushed to active
    await wait(35)

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    remopt.input({
        kind: "push-schedule",

        callbatcher: throttler_new_delay(30),

        patch_new: () => {
            return {
                applicator: Object.assign,

                data: {
                    value: 1,
                },
            }
        },

        config: {
            force: false,
            instant: false,
        },

        request_new: ({ patch, signal_abort }) => {
            const data = patch?.data

            return {
                promise: wait(20).then(() => {
                    if (signal_abort.aborted) { return }

                    outputs.push(data)
                }),
            }
        }
    })

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // nothing happens
    await wait(5)

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // only scheduled left
    controller_abort.abort()

    expect(remopt.output()?.request_active.length).toBe(0)
    expect(!!remopt.output()?.request_scheduled).toBe(true)
    assert.deepStrictEqual(outputs, expectations)

    // scheduled is moved to active
    await wait(40)

    expect(remopt.output()?.request_active.length).toBe(1)
    expect(remopt.output()?.request_scheduled).toBe(null)
    assert.deepStrictEqual(outputs, expectations)

    // invoked
    await wait(15)

    expectations.push({ value: 1 })

    expect(remopt.output()).toBe(null)
    assert.deepStrictEqual(outputs, expectations)
})
