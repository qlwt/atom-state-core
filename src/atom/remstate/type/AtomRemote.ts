import type { ReqState, } from "#src/reqstate/type/State.js";
import type { AtomState } from "#src/atom/state/type/AtomState.js";

export type AtomRemState<T, PR, PM> = AtomState<ReqState<T, PR, PM>, ReqState<T, PR, PM>>
