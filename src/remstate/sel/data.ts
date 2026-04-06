import type { SelectorDynamic_Atom } from "#src/selector/type/selector.js";
import type { Value_Atom } from "#src/value/type/value.js";
import { reqstate_data_fulfilled } from "#src/reqstate/data_fulfilled.js";
import type { ReqState } from "#src/reqstate/type/state.js";
import * as sc from "@qyu/signal-core";

type RemState_SelData_Declaration = {
    <T>(src: Value_Atom<sc.OSignal<ReqState<T>>>): SelectorDynamic_Atom<T | null>
    <T, F>(src: Value_Atom<sc.OSignal<ReqState<T>>>, fallback: () => F): SelectorDynamic_Atom<T | F>
    <T, F>(src: Value_Atom<sc.OSignal<ReqState<T>>>, fallback?: () => F): SelectorDynamic_Atom<T | F | null>
}

export const remstate_sel_data: RemState_SelData_Declaration = function <T, F>(
    src: Value_Atom<sc.OSignal<ReqState<T>>>, fallback?: () => F
): SelectorDynamic_Atom<T | null | F> {
    return store => {
        const src_value = store.reg(src)

        return sc.osignal_new_pipe(src_value, src_o => reqstate_data_fulfilled(src_o, fallback))
    }
}
