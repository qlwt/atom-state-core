import type { AtomAction } from "#src/atom/action/type/AtomAction.js"
import type { AtomRemNode, AtomRemNode_Def } from "#src/atom/remnode/type/State.js"
import { reqstate_new_empty } from "#src/reqstate/new/empty.js"
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js"
import { reqstate_new_pending } from "#src/reqstate/new/pending.js"
import { ReqState__Status, type ReqState } from "#src/reqstate/type/State.js"

export type AtomRemNode_Action_Request_Request<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"],
    PromiseMeta extends Def["request_meta"],
> = Readonly<{
    meta: PromiseMeta

    promise: Promise<PromiseResult>
    promise_abort: VoidFunction
    promise_interpret: (result: PromiseResult, meta: PromiseMeta) => Def["data"] | null

    promise_target?: (data: Def["data"]) => AtomRemNode<Def>
    promise_after?: (promise: Promise<PromiseResult>) => void
}>

export type AtomRemNode_Action_Request_Config = Readonly<{
    fallback: boolean
}>

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

export type AtomRemNode_Action_Request_Optimistic<Def extends AtomRemNode_Def> = Readonly<{
    data: Def["data"] | null
    node: AtomRemNode<Def>
}>

export type AtomRemNode_Action_Request_Params<
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"],
    PromiseMeta extends Def["request_meta"],
> = Readonly<{
    config: AtomRemNode_Action_Request_Config
    optimistic: AtomRemNode_Action_Request_Optimistic<Def> | null
    request: () => AtomRemNode_Action_Request_Request<Def, PromiseResult, PromiseMeta>
}>

export const atomremnode_action_request = function <
    Def extends AtomRemNode_Def,
    PromiseResult extends Def["request_result"] = Def["request_result"],
    PromiseMeta extends Def["request_meta"] = Def["request_meta"],
>(
    params: AtomRemNode_Action_Request_Params<Def, PromiseResult, PromiseMeta>
): AtomAction {
    return ({ reg }) => {
        if (params.optimistic) {
            const remdata = reg(params.optimistic.node)
            const real = reg(remdata.real)
            const real_o = real.output()
            const fallback = old_new(real_o)
            const request = params.request()

            switch (real_o.status) {
                case ReqState__Status.Pending: {
                    real_o.request_abort()

                    break
                }
            }

            real.input(reqstate_new_pending({
                meta: request.meta,
                optimistic: params.optimistic.data,
                fallback: params.config.fallback ? fallback : null,

                request_promise: request.promise,
                request_abort: request.promise_abort,

                request_interpret: result => {
                    const data = request.promise_interpret(result, request.meta)

                    if (data === null) {
                        return reqstate_new_empty()
                    }

                    return reqstate_new_fulfilled(data)
                },
            }))

            request.promise_after?.(request.promise)
        } else {
            const request = params.request()

            request.promise.then(result => {
                const data = request.promise_interpret(result, request.meta)

                if (data) {
                    const target = params.optimistic?.node || request.promise_target?.(data)

                    if (!target) {
                        throw new Error("Trying to make request remnode action with neither optimistic nor target node")
                    }

                    const remdata = reg(target)
                    const real = reg(remdata.real)
                    const real_o = real.output()

                    if (real_o.status === ReqState__Status.Pending) {
                        real_o.request_abort()
                    }

                    real.input(reqstate_new_fulfilled(data))
                }
            }, () => {})

            request.promise_after?.(request.promise)
        }
    }
}
