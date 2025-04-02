import type { AtomSelectorDynamic } from "#src/atom/selector/type/AtomSelector.js";
import type { AtomValue } from "#src/atom/value/type/AtomValue.js";
import { reqphase_data } from "#src/request-phase/data.js";
import type { RequestPhaseO } from "#src/request-phase/type/RequestPhase.js";
import * as sc from "@qyu/signal-core";

type AtomSelector_New_RemoteData_Declaration = {
    <T>(src: AtomValue<sc.OSignal<RequestPhaseO<T>>>): AtomSelectorDynamic<T | null>
    <T, F>(src: AtomValue<sc.OSignal<RequestPhaseO<T>>>, fallback: () => F): AtomSelectorDynamic<T | F>
    <T, F>(src: AtomValue<sc.OSignal<RequestPhaseO<T>>>, fallback?: () => F): AtomSelectorDynamic<T | F | null>
}

export const atomselector_new_remotedata: AtomSelector_New_RemoteData_Declaration = function <T, F>(
    src: AtomValue<sc.OSignal<RequestPhaseO<T>>>, fallback?: () => F
): AtomSelectorDynamic<T | null | F> {
    return store => {
        const src_value = store.reg(src)

        return sc.osignal_new_pipe(src_value, src_o => reqphase_data(src_o, fallback))
    }
}
