import { join_option_get } from "#src/join/option/get.js"
import type { Join_Option } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type JoinProp_Normalize_Memo<T, F> = {
    readonly comparator: null | ((a: T | F, b: T | F) => boolean)
}

export type JoinProp_Normalize_Config<T, F> = {
    readonly fallback?: F

    readonly memo?: JoinProp_Normalize_Memo<T, F> | null | boolean
}

const comparator_new = function <T, F>(memo: JoinProp_Normalize_Memo<T, F> | true): null | ((a: T | F, b: T | F) => boolean) {
    if (typeof memo === "boolean") {
        return null
    }

    return memo.comparator
}

export const join_prop_normalize = function <T, F = null>(
    prop: sc.OSignal<Join_Option<T>>,
    config?: JoinProp_Normalize_Config<T, F>
): sc.OSignal<T | F> {
    const nprop_memo = config?.memo ?? null

    let result = sc.osignal_new_pipe(prop, option => {
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
