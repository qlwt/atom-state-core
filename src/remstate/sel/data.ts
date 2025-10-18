import type { AtomSelectorDynamic } from "#src/selector/type/AtomSelector.js";
import type { AtomValue } from "#src/value/type/AtomValue.js";
import { reqstate_data } from "#src/reqstate/data.js";
import type { ReqState } from "#src/reqstate/type/State.js";
import * as sc from "@qyu/signal-core";

type AtomRemState_Sel_Data_Declaration = {
    <T>(src: AtomValue<sc.OSignal<ReqState<T>>>): AtomSelectorDynamic<T | null>
    <T, F>(src: AtomValue<sc.OSignal<ReqState<T>>>, fallback: () => F): AtomSelectorDynamic<T | F>
    <T, F>(src: AtomValue<sc.OSignal<ReqState<T>>>, fallback?: () => F): AtomSelectorDynamic<T | F | null>
}

export const atomremstate_sel_data: AtomRemState_Sel_Data_Declaration = function <T, F>(
    src: AtomValue<sc.OSignal<ReqState<T>>>, fallback?: () => F
): AtomSelectorDynamic<T | null | F> {
    return store => {
        const src_value = store.reg(src)

        return sc.osignal_new_pipe(src_value, src_o => reqstate_data(src_o, fallback))
    }
}
