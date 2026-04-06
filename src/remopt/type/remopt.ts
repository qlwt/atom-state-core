import type { CallBatcher } from "#src/util/callbatcher/type/batcher.js"
import * as sc from "@qyu/signal-core"

export type RemOpt_Patch<RData, PData> = {
    readonly data: PData
    readonly applicator: (root: RData, data: PData) => void
}

export type RemOpt_RequestDef = {
    readonly promise: Promise<unknown>
    readonly abort: (clear: boolean) => void
}

export type RemOpt_RequestInput<PrR> = {
    readonly promise: Promise<PrR>
    readonly hook_catch?: (reason: any) => void
    readonly hook_then?: (response: PrR) => void
    readonly hook_after?: (promise: Promise<PrR>) => void
}

export type RemOpt_Schedule_RequestNew_Params<RData> = {
    readonly id: Symbol
    readonly signal_abort: AbortSignal | null
    readonly patch: RemOpt_Patch<RData, unknown> | null
}

export type RemOpt_Active<RData> = {
    readonly id: Symbol
    readonly signal_abort?: AbortSignal
    readonly request: RemOpt_RequestDef
    readonly patch: RemOpt_Patch<RData, unknown> | null
}

export type RemOpt_Schedule<RData> = {
    readonly signal_abort?: AbortSignal
    readonly config: RemOpt_ScheduleConfig
    readonly patch: RemOpt_Patch<RData, unknown> | null
    readonly request_new: (params: RemOpt_Schedule_RequestNew_Params<RData>) => RemOpt_RequestDef
}

export type RemOpt_ScheduleConfig = {
    readonly force: boolean
    readonly instant: boolean
}

export type RemOpt_PatchNew_Params<RData, PData> = {
    readonly scheduled: RemOpt_Patch<RData, PData> | null
    readonly active: readonly (RemOpt_Patch<RData, PData> | null)[]
}

export type RemOpt_MessageClear = {
    readonly kind: "clear"

    readonly nohook_clear?: boolean
}

export type RemOpt_MessagePushSchedule_Config = Partial<RemOpt_ScheduleConfig>

export type RemOpt_MessagePushSchedule_RequestNew_Params<RData> = {
    readonly signal_abort: AbortSignal
    readonly patch: RemOpt_Patch<RData, unknown> | null
}

export type RemOpt_MessagePushSchedule<RData, PData, PrR> = {
    readonly kind: "push-schedule"

    readonly signal_abort?: AbortSignal
    readonly callbatcher?: CallBatcher
    readonly config?: RemOpt_MessagePushSchedule_Config
    readonly patch_new: (params: RemOpt_PatchNew_Params<RData, PData>) => RemOpt_Patch<RData, PData> | null
    readonly request_new: (params: RemOpt_MessagePushSchedule_RequestNew_Params<RData>) => RemOpt_RequestInput<PrR>
}

export type RemOpt_MessagePushActive_RequestNew_Params = {
    readonly signal_abort: AbortSignal
}

export type RemOpt_MessagePushActive<RData, PData, PrR> = {
    readonly kind: "push-active"

    readonly signal_abort?: AbortSignal
    readonly callbatcher?: CallBatcher
    readonly patch: RemOpt_Patch<RData, PData> | null
    readonly request_new: (params: RemOpt_MessagePushActive_RequestNew_Params) => RemOpt_RequestInput<PrR>
}

export type RemOpt_Message<RData, PData, PrR> = (
    | RemOpt_MessageClear
    | RemOpt_MessagePushActive<RData, PData, PrR>
    | RemOpt_MessagePushSchedule<RData, PData, PrR>
)

export type RemOpt_State<Data> = {
    readonly callbatcher?: CallBatcher
    readonly request_active: readonly RemOpt_Active<Data>[]
    readonly request_scheduled: RemOpt_Schedule<Data> | null
}

export interface RemOpt<RData> extends sc.Signal<RemOpt_Message<RData, unknown, unknown>, RemOpt_State<RData> | null> {
    input<PData, PrR>(message: RemOpt_Message<RData, PData, PrR>): void
}
