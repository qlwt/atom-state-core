import { join_option_expect } from "#src/join/option/expect.js"
import type { Join_Option } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type JoinProp_NormalizeExpect_Memo<T> = {
    readonly comparator: null | ((a: T, b: T) => boolean)
}

export type JoinProp_NormalizeExpect_Config<T> = {
    readonly memo?: JoinProp_NormalizeExpect_Memo<T> | null | boolean
}

const comparator_new = function <T>(memo: JoinProp_NormalizeExpect_Memo<T> | true): null | ((a: T, b: T) => boolean) {
    if (typeof memo === "boolean") {
        return null
    }

    return memo.comparator
}

export const join_prop_normalize_expect = function <T>(
    prop: sc.OSignal<Join_Option<T>>,
    config?: JoinProp_NormalizeExpect_Config<T>
): sc.OSignal<T> {
    const nprop_memo = config?.memo ?? null

    let result = sc.osignal_new_pipe(prop, join_option_expect)

    if (nprop_memo) {
        const comparator = comparator_new(nprop_memo)

        result = sc.osignal_new_memo(result, comparator)
    }

    return result
}
