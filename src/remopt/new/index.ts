import type { RemOpt, RemOpt_Message, RemOpt_MessageClear, RemOpt_MessagePushActive, RemOpt_MessagePushSchedule, RemOpt_Active, RemOpt_Schedule, RemOpt_State, RemOpt_Patch } from "#src/remopt/type/remopt.js";
import * as sc from "@qyu/signal-core";

type Def<Data> = {
    readonly params: RemOpt_New_Params
    readonly abort_sch: VoidFunction
    readonly signal: sc.Signal<RemOpt_State<Data> | null>
}

const mk_act_bymsgact = function <RData, PData, PrR>(
    def: Def<RData>, message: RemOpt_MessagePushActive<RData, PData, PrR>
): RemOpt_Active<RData> {
    let finished = false

    const abort = () => {
        if (finished) { return }

        cl_act(def, id)
    }

    const id = Symbol()
    const controller_abort = new AbortController()
    const signal_abort = AbortSignal.any([controller_abort.signal, message.signal_abort ?? null].filter(n => n !== null))

    const controls = message.request_new({ signal_abort })

    {
        signal_abort.addEventListener("abort", abort)
    }

    controls.promise.then(result => {
        if (signal_abort.aborted) { return }

        finished = true
        signal_abort.removeEventListener("abort", abort)

        sc.batcher.batch_sync(() => {
            cl_act(def, id)

            controls.hook_then?.(result)
        })
    }, reason => {
        if (signal_abort.aborted) { return }

        finished = true
        signal_abort.removeEventListener("abort", abort)

        cl_act(def, id)

        controls.hook_catch?.(reason)
    })

    {
        controls.hook_after?.(controls.promise)
    }

    return {
        id,
        patch: message.patch as RemOpt_Patch<RData, unknown> | null,

        request: {
            promise: controls.promise,

            abort: (clear) => {
                if (finished || signal_abort.aborted) { return }

                signal_abort.removeEventListener("abort", abort)
                controller_abort.abort()

                if (clear) {
                    cl_act(def, id)
                }
            },
        },
    }
}

// transform request_scheduled to request_active
const mk_act_bysch = function <Data>(sch: RemOpt_Schedule<Data>): RemOpt_Active<Data> {
    const id = Symbol()

    return {
        id,
        patch: sch.patch,

        request: sch.request_new({
            id,
            patch: sch.patch,
            signal_abort: sch.signal_abort ?? null,
        }),
    }
}

const mk_sch_bymsgsch = function <RData, PData, PrR>(
    def: Def<RData>, message: RemOpt_MessagePushSchedule<RData, PData, PrR>
): RemOpt_Schedule<RData> {
    const signal_o = def.signal.output()

    // should be removed when request_scheduled is replaced
    message.signal_abort?.addEventListener("abort", def.abort_sch)

    return {
        signal_abort: message.signal_abort,

        config: {
            force: message.config?.force ?? false,
            instant: message.config?.instant ?? false,
        },

        patch: message.patch_new({
            active: signal_o?.request_active.map(act => act.patch as RemOpt_Patch<RData, PData> | null) ?? [],
            scheduled: (signal_o?.request_scheduled?.patch ?? null) as RemOpt_Patch<RData, PData> | null
        }) as RemOpt_Patch<RData, unknown>,

        request_new: (params) => {
            let finished = false

            const abort = () => {
                if (finished) { return }

                cl_act(def, params.id)
            }

            const controller_abort = new AbortController()
            const signal_abort = AbortSignal.any([controller_abort.signal, params.signal_abort].filter(n => n !== null))

            const controls = message.request_new({
                signal_abort,
                patch: params.patch,
            })

            signal_abort.addEventListener("abort", abort)

            controls.promise.then(result => {
                if (signal_abort.aborted) { return }

                finished = true
                signal_abort.removeEventListener("abort", abort)

                sc.batcher.batch_sync(() => {
                    cl_act(def, params.id)

                    controls.hook_then?.(result)
                })
            }, reason => {
                if (signal_abort.aborted) { return }

                finished = true
                signal_abort.removeEventListener("abort", abort)

                cl_act(def, params.id)

                controls.hook_catch?.(reason)
            })

            {
                controls.hook_after?.(controls.promise)
            }

            return {
                promise: controls.promise,

                abort: (clear) => {
                    if (finished || signal_abort.aborted) { return }

                    signal_abort.removeEventListener("abort", abort)

                    controller_abort.abort()

                    if (clear) {
                        cl_act(def, params.id)
                    }
                },
            }
        },
    }
}

// clear active request and attempt to activate scheduled
const cl_act = function <Data>(def: Def<Data>, id: Symbol) {
    sc.batcher.batch_sync(() => {
        const signal = def.signal
        const signal_o = signal.output()

        if (signal_o) {
            signal.input({
                ...signal_o,

                request_active: signal_o.request_active.filter(ra => {
                    return ra.id !== id
                }),
            })

            effect_cl_act(def)
        }
    })
}

// clear scheduled request and clear the signal if needed
const cl_sch = function <Data>(def: Def<Data>) {
    sc.batcher.batch_sync(() => {
        const signal = def.signal
        const signal_o = signal.output()

        if (signal_o) {
            if (signal_o.request_active.length === 0) {
                signal.input(null)

                signal_o.request_scheduled?.signal_abort?.removeEventListener("abort", def.abort_sch)
                signal_o.callbatcher?.interrupt()

                def.params.hook_clear?.()
            } else {
                signal_o.callbatcher?.interrupt()
                signal_o.request_scheduled?.signal_abort?.removeEventListener("abort", def.abort_sch)

                signal.input({
                    ...signal_o,

                    request_scheduled: null,
                    request_active: signal_o.request_active,
                })
            }

            effect_cl_act(def)
        }
    })
}

// activates the scheduled request forcefuly
const shift_force = function <Data>(def: Def<Data>) {
    sc.batcher.batch_sync(() => {
        const signal = def.signal
        const signal_o = signal.output()

        if (signal_o && signal_o.request_scheduled) {
            const sch = signal_o.request_scheduled

            sch.signal_abort?.removeEventListener("abort", def.abort_sch)

            signal.input({
                ...signal_o,

                request_scheduled: null,
                request_active: [...signal_o.request_active, mk_act_bysch(sch)],
            })
        }
    })
}

// attempt to activate request_scheduled after promise is finished or interrupted
// if neither active nor scheduled requests present - nullify the state and call .self_delete
// will activate request_scheduled if either active.length === 0 or config.force === true && config.instant === true
// otherwise will schedule next attempt
const effect_cl_act = function <Data>(def: Def<Data>) {
    sc.batcher.batch_sync(() => {
        const signal = def.signal
        const signal_o = signal.output()

        if (signal_o) {
            const acts = signal_o.request_active

            if (signal_o.request_scheduled) {
                const sch = signal_o.request_scheduled

                if (sch.config.force || acts.length === 0) {
                    const update = () => {
                        shift_force(def)
                    }

                    if (sch.config.instant || !signal_o.callbatcher) {
                        update()
                    } else {
                        // it is assumed to already be scheduled in case when request_scheduled is forced
                        if (!sch.config.force) {
                            signal_o.callbatcher.emit(update)
                        }
                    }
                }
            } else if (acts.length === 0) {
                signal.input(null)

                def.params.hook_clear?.()
            }
        }
    })
}

// attempt to activate request_scheduled after inserting it
// will activate request_scheduled if either act === null or if config.force === true && config.instant === true
// otherwise will schedule next attempt
const effect_ins_sch = function <Data>(def: Def<Data>) {
    sc.batcher.batch_sync(() => {
        const signal = def.signal
        const signal_o = signal.output()

        if (signal_o) {
            const acts = signal_o.request_active

            if (signal_o.request_scheduled) {
                const sch = signal_o.request_scheduled

                if (sch.config.force || acts.length === 0) {
                    const update = () => {
                        shift_force(def)
                    }

                    if (sch.config.instant || !signal_o.callbatcher) {
                        update()
                    } else {
                        signal_o.callbatcher.emit(update)
                    }
                } else {
                    // waiting for activated requests to finish
                    // cancel scheduled emit in case forceful shift is already scheduled
                    signal_o.callbatcher?.interrupt()
                }
            }
        }
    })
}

const input_cl = function <Data>(def: Def<Data>, message: RemOpt_MessageClear) {
    const signal_o = def.signal.output()

    if (signal_o) {
        def.signal.input(null)

        signal_o.callbatcher?.interrupt()

        signal_o.request_active?.forEach(act => {
            act.request.abort(false)
        })

        if (!message.nohook_clear) {
            def.params.hook_clear?.()
        }
    }
}

const input_sch = function <RData, PData, PrR>(def: Def<RData>, message: RemOpt_MessagePushSchedule<RData, PData, PrR>) {
    const signal_o = def.signal.output()

    if (signal_o === null) {
        sc.batcher.batch_sync(() => {
            def.signal.input({
                callbatcher: message.callbatcher,

                request_active: [],
                request_scheduled: mk_sch_bymsgsch(def, message)
            })

            effect_ins_sch(def)
        })
    } else {
        signal_o.request_scheduled?.signal_abort?.removeEventListener("abort", def.abort_sch)

        sc.batcher.batch_sync(() => {
            def.signal.input({
                callbatcher: signal_o.callbatcher,
                request_active: signal_o.request_active,
                request_scheduled: mk_sch_bymsgsch(def, message)
            })

            effect_ins_sch(def)
        })
    }
}

const input_act = function <RData, PData, PrR>(def: Def<RData>, message: RemOpt_MessagePushActive<RData, PData, PrR>) {
    const signal_o = def.signal.output()

    if (signal_o === null) {
        def.signal.input({
            request_scheduled: null,
            callbatcher: message.callbatcher,

            request_active: [mk_act_bymsgact(def, message)],
        })
    } else {
        sc.batcher.batch_sync(() => {
            def.signal.input({
                ...signal_o,

                request_active: [...signal_o.request_active, mk_act_bymsgact(def, message)],
            })

            effect_ins_sch(def)
        })
    }
}

export type RemOpt_New_Params = {
    readonly hook_clear?: VoidFunction
}

export const remopt_new = function <RData>(params: RemOpt_New_Params): RemOpt<RData> {
    const signal = sc.signal_new_value<RemOpt_State<RData> | null>(null)

    const def: Def<RData> = {
        signal,
        params,

        abort_sch: () => {
            cl_sch(def)
        },
    }

    return {
        ...signal,

        input: function <PData, PrR>(message: RemOpt_Message<RData, PData, PrR>) {
            sc.batcher.batch_sync(() => {
                switch (message.kind) {
                    case "clear": {
                        input_cl(def, message)

                        break
                    }
                    case "push-schedule": {
                        if (message.signal_abort?.aborted) {
                            return
                        }

                        input_sch(def, message)

                        break
                    }
                    case "push-active": {
                        if (message.signal_abort?.aborted) {
                            return
                        }

                        input_act(def, message)

                        break
                    }
                }
            })
        },
    }
}
