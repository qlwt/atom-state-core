import type { Value_Atom } from "#src/value/type/value.js"
import * as sc from "@qyu/signal-core"

export type RemReq_State<Data> = {
    readonly data: Data
    readonly abort: VoidFunction
    readonly promise: Promise<unknown>
}

export type RemReq<Data> = sc.Signal<RemReq_State<Data> | null>

export type RemReq_Atom<Data> = Value_Atom<RemReq<Data>>
