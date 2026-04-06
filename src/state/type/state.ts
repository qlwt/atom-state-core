import type { Value_Atom } from "#src/value/type/value.js";
import type * as sc from "@qyu/signal-core"

export type State_Atom<I = any, O = I> = Value_Atom<sc.Signal<I, O>>
