import { join_option_get } from "#src/join/option/get.js"
import { Join_Option_Kind, type Join_Option } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type JoinRoot_Normalize_Memo<T, F> = {
    readonly comparator: null | ((a: T | F, b: T | F) => boolean)
}

export type JoinRoot_Normalize_Config<T, F, FT> = {
    readonly fallback?: F
    readonly fallback_top?: FT

    readonly memo?: JoinRoot_Normalize_Memo<T, F> | null | boolean
}

const comparator_new = function <T, F>(memo: JoinRoot_Normalize_Memo<T, F> | true): null | ((a: T | F, b: T | F) => boolean) {
    if (typeof memo === "boolean") {
        return null
    }

    return memo.comparator
}

export const join_root_normalize = function <T, F = null, FT = null>(
    root: Join_Option<sc.OSignal<Join_Option<T>>>,
    config?: JoinRoot_Normalize_Config<T, F, FT>
): FT | sc.OSignal<T | F> {
    const nprop_memo = config?.memo ?? null

    if (root.kind === Join_Option_Kind.None) {
        if (config && "fallback_top" in config) {
            return config.fallback_top as FT
        }

        return null as FT
    }

    let result = sc.osignal_new_pipe(root.value, option => {
        if (config && "fallback" in config) {
            return join_option_get({
                option: option,
                fallback: config.fallback as F,
            })
        }

        return join_option_get({
            option: option,
            fallback: null as F,
        })
    })

    if (nprop_memo) {
        const comparator = comparator_new(nprop_memo)

        result = sc.osignal_new_memo(result, comparator)
    }

    return result
}
