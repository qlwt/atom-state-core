import type { ReqState, } from "#src/reqstate/type/State.js";
import type { AtomState } from "#src/state/type/AtomState.js";
import type * as sc from "@qyu/signal-core"

export type AtomRemState_Value<T, PR, PM> = sc.Signal<ReqState<T, PR, PM>, ReqState<T, PR, PM>>

export type AtomRemState<T, PR, PM> = AtomState<ReqState<T, PR, PM>, ReqState<T, PR, PM>>
