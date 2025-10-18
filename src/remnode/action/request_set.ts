import type { AtomAction } from "#src/action/type/AtomAction.js"
import type { AtomRemNode, AtomRemNode_Def } from "#src/remnode/type/State.js"
import { reqstate_new_empty } from "#src/reqstate/new/empty.js"
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js"
import { reqstate_new_pending } from "#src/reqstate/new/pending.js"
import { ReqState__Status, type ReqState } from "#src/reqstate/type/State.js"

export type AtomRemNode_Action_RequestSet_InterpretApi<
    Def extends AtomRemNode_Def,
    PromiseResult,
    PromiseMeta
> = Readonly<{
    meta: PromiseMeta
    result: PromiseResult
    fallback: Def["data"] | null
    optimistic: Def["data"] | null
}>

export type AtomRemNode_Action_RequestSet_RequestSet<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"],
    PromiseMeta extends Def["request_meta"],
> = Readonly<{
    meta: PromiseMeta

    promise: Promise<PromiseResult>
    promise_abort?: () => void
    promise_interpret: (api: AtomRemNode_Action_RequestSet_InterpretApi<Def, PromiseResult, PromiseMeta>) => Def["data"] | null
    promise_target?: (api: AtomRemNode_Action_RequestSet_InterpretApi<Def, PromiseResult, PromiseMeta>) => AtomRemNode<Def> | null
}>

export type AtomRemNode_Action_RequestSet_Optimistic<Def extends AtomRemNode_Def> = {
    fallback: boolean
    node: AtomRemNode<Def>
    data: Def["data"] | null
}

const old_new = function <Def extends AtomRemNode_Def>(phase: ReqState<Def["data"]>): Def["data"] | null {
    switch (phase.status) {
        case ReqState__Status.Empty:
            return null
        case ReqState__Status.Pending:
            return phase.fallback
        case ReqState__Status.Fulfilled:
            return phase.data
    }

    return null
}

export type AtomRemNode_Action_RequestSet_Params<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"],
    PromiseMeta extends Def["request_meta"],
> = Readonly<{
    request: AtomRemNode_Action_RequestSet_RequestSet<Def, PromiseResult, PromiseMeta>
    optimistic?: AtomRemNode_Action_RequestSet_Optimistic<Def>
}>

export const atomremnode_action_request_set = function <
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"] = Def["request_result"],
    PromiseMeta extends Def["request_meta"] = Def["request_meta"],
>(
    params: AtomRemNode_Action_RequestSet_Params<Def, PromiseResult, PromiseMeta>
): AtomAction {
    return ({ reg }) => {
        const optimistic = params.optimistic

        if (optimistic) {
            const request = params.request
            const opt_remnode = reg(optimistic.node)
            const opt_real = opt_remnode.real
            const opt_real_o = opt_real.output()
            const fallback_value = old_new(opt_real_o)

            if (opt_real_o.status === ReqState__Status.Pending) {
                opt_real_o.request_abort()
            }

            opt_real.input(reqstate_new_pending({
                meta: request.meta,
                optimistic: optimistic.data,
                fallback: optimistic.fallback ? fallback_value : null,

                request_promise: request.promise,

                request_abort: () => {
                    request.promise_abort?.()
                },

                request_interpret: result => {
                    const data = request.promise_interpret({
                        result,
                        fallback: fallback_value,
                        meta: request.meta,
                        optimistic: optimistic.data,
                    })

                    const after_atomremnode = (request.promise_target
                        ? request.promise_target({
                            result,
                            fallback: null,
                            optimistic: null,
                            meta: request.meta,
                        })
                        : optimistic.node
                    )

                    if (data === null || after_atomremnode === null) {
                        return reqstate_new_empty()
                    }

                    if (after_atomremnode !== optimistic.node) {
                        const after_remnode = reg(after_atomremnode)
                        const after_real = after_remnode.real
                        const after_real_o = after_real.output()

                        if (after_real_o.status === ReqState__Status.Pending) {
                            after_real_o.request_abort()
                        }

                        after_real.input(reqstate_new_fulfilled(data))

                        return reqstate_new_empty()
                    }

                    return reqstate_new_fulfilled(data)
                },
            }))
        } else {
            const request = params.request

            request.promise.then(result => {
                if (!request.promise_target) {
                    throw new Error("No request.promise_target provided for pessimistic request")
                }

                const data = request.promise_interpret({
                    result,
                    fallback: null,
                    optimistic: null,
                    meta: request.meta,
                })

                const atomremnode = request.promise_target({
                    result,
                    fallback: null,
                    optimistic: null,
                    meta: request.meta,
                })

                if (data && atomremnode) {
                    const remnode = reg(atomremnode)
                    const real = remnode.real
                    const real_o = real.output()

                    if (real_o.status === ReqState__Status.Pending) {
                        real_o.request_abort()
                    }

                    real.input(reqstate_new_fulfilled(data))
                }
            }, () => { })
        }
    }
}
