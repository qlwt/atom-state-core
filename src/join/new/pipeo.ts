import { Join_Option_Kind, type Join, type Join_Option_Expect, type JoinF, type JoinP } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type Join_NewPipeO_Memo<T> = {
    readonly comparator: null | ((a: T, b: T) => boolean)
}

export type Join_NewPipeO_Params<Param, Output, FOutput> = {
    readonly join: JoinP<Param, Output>
    readonly transformer: (output: Output) => FOutput

    readonly memo?: Join_NewPipeO_Memo<FOutput> | null
}

export const join_new_pipeo = function <Param, Output, FOutput>(
    params: Join_NewPipeO_Params<Param, Output, FOutput>
): Join<Param, FOutput> {
    const join = typeof params.join === "function" ? params.join() : params.join
    const nprop_memo = params.memo ?? null

    return {
        root: param => {
            const join_root = join.root(param)

            if (join_root.kind === Join_Option_Kind.None) {
                return join_root
            }

            let result = sc.osignal_new_pipe(
                join_root.value,
                output => {
                    switch (output.kind) {
                        case Join_Option_Kind.View:
                            return {
                                kind: Join_Option_Kind.View,
                                value: params.transformer(output.value),
                            }
                    }

                    return output
                }
            )

            if (nprop_memo) {
                const comparator = nprop_memo.comparator

                result = sc.osignal_new_memo(
                    result,
                    comparator && ((a, b) => {
                        if (a.kind !== b.kind) { return false }
                        if (a.kind === Join_Option_Kind.None) { return true }

                        return comparator(a.value, (b as Join_Option_Expect<typeof b>).value)
                    })
                )
            }

            return {
                kind: Join_Option_Kind.View,

                value: result
            }
        },

        prop: param_s => {
            let result = sc.osignal_new_pipe(
                join.prop(param_s),
                output => {
                    switch (output.kind) {
                        case Join_Option_Kind.View:
                            return {
                                kind: Join_Option_Kind.View,
                                value: params.transformer(output.value),
                            }
                    }

                    return output
                }
            )

            if (nprop_memo) {
                const comparator = nprop_memo.comparator

                result = sc.osignal_new_memo(
                    result,
                    comparator && ((a, b) => {
                        if (a.kind !== b.kind) { return false }
                        if (a.kind === Join_Option_Kind.None) { return true }

                        return comparator(a.value, (b as Join_Option_Expect<typeof b>).value)
                    })
                )
            }

            return result
        },
    }
}

export const join_newf_pipeo = function <Param, Output, FOutput>(
    params: Join_NewPipeO_Params<Param, Output, FOutput>
): JoinF<Param, FOutput> {
    const result = join_new_pipeo(params)

    return () => result
}

export const join_news_pipeo = function <Param, Output, FOutput>(
    transformer: (output: Output) => FOutput,
    join: JoinP<Param, Output>,
): JoinF<Param, FOutput> {
    const result = join_new_pipeo({
        join,
        transformer,
    })

    return () => result
}
