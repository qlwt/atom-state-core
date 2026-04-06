import { join_option_expect } from "#src/join/option/expect.js"
import { Join_Option_Kind, type Join_Option } from "#src/join/type/join.js"
import * as sc from "@qyu/signal-core"

export type JoinRoot_NormalizeExpect_Memo<T> = {
    readonly comparator: null | ((a: T , b: T ) => boolean)
}

export type JoinRoot_NormalizeExpect_Config<T> = {
    readonly memo?: JoinRoot_NormalizeExpect_Memo<T> | null | boolean
}

const comparator_new = function <T>(memo: JoinRoot_NormalizeExpect_Memo<T> | true): null | ((a: T , b: T ) => boolean) {
    if (typeof memo === "boolean") {
        return null
    }

    return memo.comparator
}

export const join_root_normalize_expect = function <T>(
    root: Join_Option<sc.OSignal<Join_Option<T>>>,
    config?: JoinRoot_NormalizeExpect_Config<T>
): sc.OSignal<T > {
    const nprop_memo = config?.memo ?? null

    if (root.kind === Join_Option_Kind.None) {
        throw new Error(`Expected option to be non-nullish`)
    }

    let result = sc.osignal_new_pipe(root.value, join_option_expect)

    if (nprop_memo) {
        const comparator = comparator_new(nprop_memo)

        result = sc.osignal_new_memo(result, comparator)
    }

    return result
}
