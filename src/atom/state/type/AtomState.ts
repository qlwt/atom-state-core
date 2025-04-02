import type { AtomValue } from "#src/atom/value/type/AtomValue.js";
import type * as sc from "@qyu/signal-core"

export type AtomState<I = any, O = I> = AtomValue<sc.Signal<I, O>>
