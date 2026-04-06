import { Join_Option_Kind, type Join, type JoinF, type JoinP } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type Join_NewFallbackI_Params<Param, Output, Fallback> = {
    readonly join: JoinP<Param | Fallback, Output>
    readonly fallback: Fallback
}

export const join_new_fallbacki = function <Param, Output, Fallback>(
    params: Join_NewFallbackI_Params<Param, Output, Fallback>
): Join<Param, Output> {
    const join = typeof params.join === "function" ? params.join() : params.join

    return {
        root: param => {
            return join.root(param)
        },

        prop: param_s => {
            return join.prop(sc.osignal_new_pipe(
                param_s,
                param => {
                    switch (param.kind) {
                        case Join_Option_Kind.None:
                            return {
                                kind: Join_Option_Kind.View,
                                value: params.fallback,
                            }
                        case Join_Option_Kind.View:
                            return param
                    }
                }
            ))
        },
    }
}

export const join_newf_fallbacki = function <Param, Output, Fallback>(
    params: Join_NewFallbackI_Params<Param, Output, Fallback>
): JoinF<Param, Output> {
    const result = join_new_fallbacki(params)

    return () => result
}

export const join_news_fallbacki = function <Param, Output, Fallback>(
    fallback: Fallback, join: JoinP<Param | Fallback, Output>
): JoinF<Param, Output> {
    const result = join_new_fallbacki({
        join,
        fallback,
    })

    return () => result
}
