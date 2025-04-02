import type { RequestPhase, RequestPhaseO } from "#src/request-phase/type/RequestPhase.js";
import type { AtomState } from "#src/atom/state/type/AtomState.js";

export type AtomRemote<T> = AtomState<RequestPhase<T>, RequestPhaseO<T>>
