import type { AtomValue } from "#src/value/type/AtomValue.js"
import * as sc from "@qyu/signal-core"

export type AtomRemReq_State<Data> = {
    readonly data: Data
    readonly abort: VoidFunction
    readonly promise: Promise<unknown>
}

export type AtomRemReq_Value<Data> = sc.Signal<AtomRemReq_State<Data> | null, AtomRemReq_State<Data> | null>

export type AtomRemReq<Data> = AtomValue<AtomRemReq_Value<Data>>
