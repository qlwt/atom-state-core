import { Join_Option_Kind, type Join, type JoinF, type JoinP } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type Join_NewFilterI_Params<Param, TParam extends Param, Output> = {
    readonly join: JoinP<TParam, Output>
    readonly filter: (param: Param) => param is TParam
}

export const join_new_filteri = function <Param, TParam extends Param, Output>(
    params: Join_NewFilterI_Params<Param, TParam, Output>
): Join<Param, Output> {
    const join = typeof params.join === "function" ? params.join() : params.join

    return {
        root: param => {
            if (params.filter(param)) {
                return join.root(param)
            }

            return {
                kind: Join_Option_Kind.None
            }
        },

        prop: param_s => {
            return join.prop(sc.osignal_new_pipe(
                param_s,
                param_p => {
                    if (param_p.kind === Join_Option_Kind.None) {
                        return param_p
                    }

                    if (params.filter(param_p.value)) {
                        return {
                            kind: Join_Option_Kind.View,
                            value: param_p.value
                        }
                    }

                    return {
                        kind: Join_Option_Kind.None
                    }
                }
            ))
        },
    }
}

export const join_newf_filteri = function <Param, TParam extends Param, Output>(
    params: Join_NewFilterI_Params<Param, TParam, Output>
): JoinF<Param, Output> {
    const result = join_new_filteri(params)

    return () => result
}

export const join_news_filteri = function <Param, TParam extends Param, Output>(
    join: JoinP<TParam, Output>, filter: (param: Param) => param is TParam
): JoinF<Param, Output> {
    const result = join_new_filteri({
        join,
        filter,
    })

    return () => result
}
