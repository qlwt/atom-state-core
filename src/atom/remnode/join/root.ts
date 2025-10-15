import { atomremnode_data } from "#src/atom/remnode/data/index.js"
import type { AtomRemNode__Data } from "#src/atom/remnode/type/Data.js"
import type { AtomRemNode_Join, AtomRemNode_Join_Factory } from "#src/atom/remnode/type/Join.js"
import type { AtomRemNode_Def, AtomRemNode_Value } from "#src/atom/remnode/type/State.js"
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js"
import * as sc from "@qyu/signal-core"

type G_Properties<Def extends AtomRemNode_Def> = {
    readonly [K in keyof Def["data"]]?: AtomRemNode_Join_Factory<
        sc.OSignal<Def["data"][K] | null>,
        any
    >
}

type Properties_Parse<Src extends G_Properties<any>> = {
    [K in keyof Src]: (Src[K] extends AtomRemNode_Join_Factory<any, infer Result>
        ? Result
        : never
    )
}

type Overrides<Properties extends G_Properties<any>> = {
    [K in keyof Properties]: (Properties extends AtomRemNode_Join_Factory<any, infer Result>
        ? sc.OSignal<Result | null>
        : never
    )
}

export type AtomRemNode_Join_Root_Params<
    Param,
    Def extends AtomRemNode_Def,
    Properties extends G_Properties<Def>,
> = Readonly<{
    properties: Properties
    link: AtomSelectorStatic<(index: Param) => AtomRemNode_Value<Def>>
}>

export const atomremnode_join_root = function <
    Param,
    Def extends AtomRemNode_Def,
    Properties extends G_Properties<Def>,
>(params: AtomRemNode_Join_Root_Params<Param, Def, Properties>): AtomRemNode_Join_Factory<
    Param,
    AtomRemNode_Join<Def, Properties_Parse<Properties>>
> {
    return ({ reg }) => {
        return (...key) => {
            const overrides: Partial<Overrides<Properties>> = {}

            const data = reg(atomremnode_data({
                remnode: ({ reg }) => reg(params.link)(...key)
            }))

            for (const key of Object.keys(params.properties)) {
                const property = params.properties[key as keyof Properties] as AtomRemNode_Join_Factory<
                    sc.OSignal<Def["data"][keyof Def["data"]] | AtomRemNode__Data<Def> | null>,
                    any
                >

                if (property) {
                    const property_param = sc.osignal_new_memo(sc.osignal_new_pipe(data, data_o => {
                        if (data_o === null || data_o.data === null) {
                            return null
                        }

                        if (key in data_o.data) {
                            return data_o.data[key as Extract<keyof Def["data"], string>]
                        }

                        return data_o
                    }))

                    overrides[key as keyof Properties] = sc.osignal_new_memo(reg(property)(property_param)) as any
                }
            }

            return sc.osignal_new_memo(sc.osignal_new_pipe(
                sc.osignal_new_merge([
                    sc.osignal_new_memo(data),
                    sc.osignal_new_memo(sc.osignal_new_mergemap(overrides))
                ] as const),
                ([data_o, overrides_o]) => {
                    if (data_o === null) { return null }

                    if (data_o.data) {
                        const cpy = {
                            ...data_o.data,
                        }

                        for (const key of Object.keys(overrides)) {
                            const override = overrides_o[key as keyof Overrides<Properties>]

                            if (override === null) {
                                return null
                            } else {
                                cpy[key as keyof typeof cpy] = override as any
                            }
                        }

                        return {
                            ...data_o,

                            data: cpy,
                        } as AtomRemNode_Join<Def, Properties_Parse<Properties>>
                    }

                    return data_o as AtomRemNode_Join<Def, Properties_Parse<Properties>>
                }
            ))
        }
    }
}
