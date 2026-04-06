import { Join_Option_Kind, type Join, type Join_Option_Expect, type JoinF, type JoinP } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type Join_NewPipeOData_Memo<T> = {
    readonly comparator: null | ((a: T, b: T) => boolean)
}

export type Join_NewPipeOData_Params<Param, Output> = {
    readonly join: JoinP<Param, { readonly data: Output }>
    readonly memo?: Join_NewPipeOData_Memo<Output> | null
}

export const join_new_pipeo_data = function <Param, Output>(
    params: Join_NewPipeOData_Params<Param, Output>
): Join<Param, Output> {
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
                                value: output.value.data,
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

                value: sc.osignal_new_pipe(
                    join_root.value,
                    output => {
                        switch (output.kind) {
                            case Join_Option_Kind.View:
                                return {
                                    kind: Join_Option_Kind.View,
                                    value: output.value.data,
                                }
                        }

                        return output
                    }
                )
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
                                value: output.value.data,
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

export const join_newf_pipeo_data = function <Param, Output>(
    params: Join_NewPipeOData_Params<Param, Output>
): JoinF<Param, Output> {
    const result = join_new_pipeo_data(params)

    return () => result
}

export const join_news_pipeo_data = function <Param, Output>(
    join: JoinP<Param, { readonly data: Output }>
): JoinF<Param, Output> {
    const result = join_new_pipeo_data({ join })

    return () => result
}
