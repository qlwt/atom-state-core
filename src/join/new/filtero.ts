import { Join_Option_Kind, type Join, type JoinP, type JoinF, type Join_Option } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type Join_NewFilterO_Params<Param, Output, FOutput extends Output> = {
    readonly join: JoinP<Param, Output>
    readonly filter: (output: Output) => output is FOutput
}

export const join_new_filtero = function <Param, Output, FOutput extends Output>(
    params: Join_NewFilterO_Params<Param, Output, FOutput>
): Join<Param, FOutput> {
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
                            case Join_Option_Kind.View:
                                if (params.filter(output.value)) {
                                    return output as Join_Option<FOutput>
                                }

                                return {
                                    kind: Join_Option_Kind.None,
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
                        case Join_Option_Kind.View:
                            if (params.filter(output.value)) {
                                return output as Join_Option<FOutput>
                            }

                            return {
                                kind: Join_Option_Kind.None,
                            }
                    }

                    return output
                }
            )
        },
    }
}

export const join_newf_filtero = function <Param, Output, FOutput extends Output>(
    params: Join_NewFilterO_Params<Param, Output, FOutput>
): JoinF<Param, FOutput> {
    const result = join_new_filtero(params)

    return () => result
}

export const join_news_filtero = function <Param, Output, FOutput extends Output>(
    join: JoinP<Param, Output>, filter: (output: Output) => output is FOutput
): JoinF<Param, FOutput> {
    const result = join_new_filtero({
        join,
        filter,
    })

    return () => result
}
