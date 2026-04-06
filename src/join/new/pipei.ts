import { Join_Option_Kind, type Join, type JoinF, type JoinP } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type Join_NewPipeI_Memo<T> = {
    readonly comparator: null | ((a: T, b: T) => boolean)
}

export type Join_NewPipeI_Params<Param, TParam, Output> = {
    readonly join: JoinP<TParam, Output>
    readonly transformer: (param: Param) => TParam

    readonly memo?: null | Join_NewPipeI_Memo<TParam>
}

export const join_new_pipei = function <Param, TParam, Output>(
    params: Join_NewPipeI_Params<Param, TParam, Output>
): Join<Param, Output> {
    const join = typeof params.join === "function" ? params.join() : params.join
    const nprop_memo = params.memo ?? null

    return {
        root: param => {
            return join.root(params.transformer(param))
        },

        prop: param_s => {
            let result = sc.osignal_new_pipe(
                param_s,
                param => {
                    switch (param.kind) {
                        case Join_Option_Kind.None:
                            return {
                                kind: Join_Option_Kind.None,
                            } as const
                        case Join_Option_Kind.View:
                            return {
                                kind: Join_Option_Kind.View,
                                value: params.transformer(param.value)
                            } as const
                    }
                }
            )

            if (nprop_memo) {
                const comparator = nprop_memo.comparator

                result = sc.osignal_new_memo(
                    result,
                    comparator && ((a, b) => {
                        if (a.kind !== b.kind) { return false }
                        if (a.kind === Join_Option_Kind.None) { return true }

                        return comparator(a.value, b.value!)
                    })
                )
            }

            return join.prop(result)
        },
    }
}

export const join_newf_pipei = function <Param, TParam, Output>(
    params: Join_NewPipeI_Params<Param, TParam, Output>
): JoinF<Param, Output> {
    const result = join_new_pipei(params)

    return () => result
}

export const join_news_pipei = function <Param, TParam, Output>(
    transformer: (param: Param) => TParam,
    join: JoinP<TParam, Output>,
): JoinF<Param, Output> {
    const result = join_new_pipei({
        join,
        transformer,
    })

    return () => result
}
