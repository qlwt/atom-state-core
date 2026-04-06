import { Join_Option_Kind, type Join, type JoinF, type JoinP } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

type ItValue<It extends Iterable<any>> = (It extends Iterable<infer T>
    ? T
    : never
)

export type Join_NewListFlat_Params<Param extends Iterable<any>, Output> = {
    readonly join: JoinP<ItValue<Param>, Output>
}

export const join_new_listflat = function <Param extends sc.OSignal<Iterable<any>>, Output>(
    params: Join_NewListFlat_Params<sc.Signal_InferO<Param>, Output>
): Join<Param, Output[]> {
    const join = typeof params.join === "function" ? params.join() : params.join

    return {
        root: param => {
            return {
                kind: Join_Option_Kind.View,

                value: sc.osignal_new_pipe(
                    sc.osignal_new_pipeflat(
                        sc.osignal_new_listpipe(
                            param,
                            join_param => {
                                const join_root = join.root(join_param)

                                if (join_root.kind === Join_Option_Kind.View) {
                                    return sc.osignal_new_memo(join_root.value, null)
                                }

                                return null
                            }
                        ),
                        outputs => sc.osignal_new_merge(outputs)
                    ),
                    outputs => {
                        const result: Output[] = []

                        for (const output of outputs) {
                            if (output && output.kind === Join_Option_Kind.View) {
                                result.push(output.value)
                            }
                        }

                        return {
                            kind: Join_Option_Kind.View,
                            value: result,
                        }
                    }
                )
            }
        },

        prop: param_s => {
            const iterable_s = sc.osignal_new_pipeflat(param_s, param => {
                if (param.kind === Join_Option_Kind.None) {
                    return null
                }

                return param.value
            })

            return sc.osignal_new_pipeflat_pick(
                sc.osignal_new_listpipe(
                    iterable_s,
                    join_param => {
                        const join_root = join.root(join_param)

                        if (join_root.kind === Join_Option_Kind.View) {
                            return sc.osignal_new_memo(join_root.value, null)
                        }

                        return null
                    }
                ),
                outputs => {
                    if (outputs === null) {
                        return {
                            pick: false,

                            value: {
                                kind: Join_Option_Kind.None,
                            } as const,
                        } as const
                    }

                    return {
                        pick: true,

                        value: sc.osignal_new_pipe(
                            sc.osignal_new_merge(outputs),
                            outputs => {
                                const result: Output[] = []

                                for (const output of outputs) {
                                    if (output && output.kind === Join_Option_Kind.View) {
                                        result.push(output.value)
                                    }
                                }

                                return {
                                    kind: Join_Option_Kind.View,
                                    value: result,
                                }
                            }
                        )
                    } as const
                }
            )
        },
    }
}

export const join_newf_listflat = function <Param extends sc.OSignal<Iterable<any>>, Output>(
    params: Join_NewListFlat_Params<sc.Signal_InferO<Param>, Output>
): JoinF<Param, Output[]> {
    const result = join_new_listflat(params)

    return () => result
}

export const join_news_listflat = function <Param extends sc.OSignal<Iterable<any>>, Output>(
    join: JoinP<ItValue<sc.Signal_InferO<Param>>, Output>
): JoinF<Param, Output[]> {
    const result = join_new_listflat({
        join
    })

    return () => result
}
