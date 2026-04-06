import { Join_Option_Kind, type Join, type JoinP, type JoinF } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type Join_NewFallbackO_Params<Param, Output, Fallback> = {
    readonly join: JoinP<Param, Output>
    readonly fallback: Fallback
}

export const join_new_fallbacko = function <Param, Output, Fallback>(
    params: Join_NewFallbackO_Params<Param, Output, Fallback>
): Join<Param, Output | Fallback> {
    const join = typeof params.join === "function" ? params.join() : params.join

    return {
        root: param => {
            const join_root = join.root(param)

            if (join_root.kind === Join_Option_Kind.None) {
                return join_root
            }

            return {
                kind: Join_Option_Kind.View,

                value: sc.osignal_new_pipe(
                    join_root.value,
                    output => {
                        switch (output.kind) {
                            case Join_Option_Kind.None:
                                return {
                                    kind: Join_Option_Kind.View,
                                    value: params.fallback,
                                }
                        }

                        return output
                    }
                )
            }
        },

        prop: param_s => {
            return sc.osignal_new_pipe(
                join.prop(param_s),
                output => {
                    switch (output.kind) {
                        case Join_Option_Kind.None:
                            return {
                                kind: Join_Option_Kind.View,
                                value: params.fallback,
                            }
                    }

                    return output
                }
            )
        },
    }
}

export const join_newf_fallbacko = function <Param, Output, Fallback>(
    params: Join_NewFallbackO_Params<Param, Output, Fallback>
): JoinF<Param, Output | Fallback> {
    const result = join_new_fallbacko(params)

    return () => result
}

export const join_news_fallbacko = function <Param, Output, Fallback>(
    fallback: Fallback, join: JoinP<Param, Output>
): JoinF<Param, Output | Fallback> {
    const result = join_new_fallbacko({
        join,
        fallback,
    })

    return () => result
}
