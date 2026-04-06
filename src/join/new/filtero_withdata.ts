import { Join_Option_Kind, type Join, type JoinF, type JoinP, type Join_Option } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type Join_NewFilterOWithData_Output<Input extends { readonly data: any }> = (
    & Omit<Input, "data">
    & {
        [K in "data"]: NonNullable<Input[K]>
    }
)

export type Join_NewFilterOWithData_Params<Param, Output extends { readonly data: any }> = {
    readonly join: JoinP<Param, Output>
}

export const join_new_filtero_withdata = function <Param, Output extends { readonly data: any }>(
    params: Join_NewFilterOWithData_Params<Param, Output>
): Join<Param, Join_NewFilterOWithData_Output<Output>> {
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
                                if (output.value.data !== undefined && output.value.data !== null) {
                                    return output as any as Join_Option<Join_NewFilterOWithData_Output<Output>>
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
                            if (output.value.data !== undefined && output.value.data !== null) {
                                return output as any as Join_Option<Join_NewFilterOWithData_Output<Output>>
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

export const join_newf_filtero_withdata = function <Param, Output extends { readonly data: any }>(
    params: Join_NewFilterOWithData_Params<Param, Output>
): JoinF<Param, Join_NewFilterOWithData_Output<Output>> {
    const result = join_new_filtero_withdata(params)

    return () => result
}

export const join_news_filtero_withdata = function <Param, Output extends { readonly data: any }>(
    join: JoinP<Param, Output>
): JoinF<Param, Join_NewFilterOWithData_Output<Output>> {
    const result = join_new_filtero_withdata({
        join
    })

    return () => result
}

