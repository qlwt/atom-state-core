import { family_new_hash } from "#src/family/new/hash.js"
import type { RemNode, RemNode_Cloner, RemNode_Def } from "#src/remnode/type/def.js"
import { remopt_new } from "#src/remopt/new/index.js"
import type { RemOpt } from "#src/remopt/type/remopt.js"
import { remstate_new } from "#src/remstate/new/index.js"
import { reqstate_new_empty } from "#src/reqstate/new/empty.js"
import { reqstate_new_fulfilled } from "#src/reqstate/new/fulfilled.js"

const real_new = function <Def extends RemNode_Def>(init: Def["data"] | null) {
    const value = init

    if (value === null) {
        return reqstate_new_empty({ error: null })
    }

    return reqstate_new_fulfilled(value)
}

export type RemNode_New_Meta<Def extends RemNode_Def> = {
    readonly cloner?: RemNode_Cloner<Def["data"]> | null
}

export type RemNode_New_Params<Def extends RemNode_Def> = {
    readonly statics: Def["statics"]
    readonly init: Def["data"] | null
    readonly meta?: RemNode_New_Meta<Def>
}

export const remnode_new = function <Def extends RemNode_Def>(params: RemNode_New_Params<Def>): RemNode<Def> {
    const optimistic = family_new_hash<string, RemOpt<Partial<Def["data"]>>>({
        key: (k) => k,

        get: (k, api) => {
            const result = remopt_new<Def["data"]>({
                hook_clear: () => {
                    optimistic.delete(k)
                }
            })

            api.cache(result, {
                cleanup: () => {
                    result.input({
                        kind: "clear",

                        nohook_clear: true,
                    })
                },
            })

            return result
        }
    })

    return {
        optimistic,
        statics: params.statics,
        real: remstate_new<Def["data"], Def["request_result"], Def["request_meta"]>(real_new(params.init)),

        meta: {
            cloner: params.meta?.cloner ?? ((src, cb) => {
                const cpy = Object.assign({}, src)

                cb(cpy)

                return cpy
            })
        },
    }
}
