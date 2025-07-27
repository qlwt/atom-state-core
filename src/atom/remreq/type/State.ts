import * as sc from "@qyu/signal-core"
import * as asc from "@qyu/atom-state-core"

export type AtomRemReq_State<Data> = {
    readonly data: Data
    readonly abort: VoidFunction
    readonly promise: Promise<unknown>
}

export type AtomRemReq_Value<Data> = sc.Signal<AtomRemReq_State<Data> | null, AtomRemReq_State<Data> | null>

export type AtomRemReq<Data> = asc.AtomValue<AtomRemReq_Value<Data>>
