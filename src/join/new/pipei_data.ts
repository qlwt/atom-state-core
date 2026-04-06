import { Join_Option_Kind, type Join, type JoinF, type JoinP } from "#src/join/type/join.js"
import type { RemView } from "#src/remview/type/view.js"
import * as sc from "@qyu/signal-core"

export type Join_NewPipeIData_Memo<T> = {
    readonly comparator: null | ((a: T, b: T) => boolean)
}

export type Join_NewPipeIData_Params<Param extends RemView<any>, TParam, Output> = {
    readonly join: JoinP<TParam, Output>
    readonly transformer: (param: NonNullable<Param["data"]>) => TParam

    readonly memo?: null | Join_NewPipeIData_Memo<TParam>
}

export const join_new_pipei_data = function <Param extends RemView<any>, TParam, Output>(
    params: Join_NewPipeIData_Params<Param, TParam, Output>
): Join<Param, Output> {
    const join = typeof params.join === "function" ? params.join() : params.join
    const nprop_memo = params.memo ?? null

    return {
        root: param => {
            if (!param.data) {
                return { kind: Join_Option_Kind.None }
            }

            return join.root(param.data)
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
                            if (param.value.data) {
                                return {
                                    kind: Join_Option_Kind.View,
                                    value: params.transformer(param.value.data)
                                } as const
                            }

                            {
                                return {
                                    kind: Join_Option_Kind.None
                                } as const
                            }
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

export const join_newf_pipei_data = function <Param extends RemView<any>, TParam, Output>(
    params: Join_NewPipeIData_Params<Param, TParam, Output>
): JoinF<Param, Output> {
    const result = join_new_pipei_data(params)

    return () => result
}

export const join_news_pipei_data = function <Param extends RemView<any>, TParam, Output>(
    transformer: (param: NonNullable<Param["data"]>) => TParam,
    join: JoinP<TParam, Output>,
): JoinF<Param, Output> {
    const result = join_new_pipei_data({
        join,
        transformer,
    })

    return () => result
}
