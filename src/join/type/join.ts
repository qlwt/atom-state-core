import type { SelectorStatic_Atom } from "#src/selector/type/selector.js"
import type * as sc from "@qyu/signal-core"

export enum Join_Option_Kind {
    None,
    View
}

export type Join_OptionNone = {
    readonly kind: Join_Option_Kind.None
}

export type Join_OptionView<T> = {
    readonly kind: Join_Option_Kind.View
    readonly value: T
}

export type Join_Option<T> = (
    | Join_OptionNone
    | Join_OptionView<T>
)

export type Join_InferOut<J extends Join<any, any>> = (
    J extends Join<any, infer O> ? O : never
)

export type Join_InferParam<J extends Join<any, any>> = (
    J extends Join<infer P, any> ? P : never
)

export type JoinF<Param, Output> = {
    (): Join<Param, Output>
}

export type JoinP<Param, Output> = (
    | JoinF<Param, Output>
    | Join<Param, Output>
)

export type Join_Option_Expect<P extends Join_Option<any>> = Join_OptionView<Join_Option_InferValue<P>>

export type Join_Option_InferValue<Prop extends Join_Option<any>> = (
    Prop extends Join_OptionView<infer T> ? T : never
)

export type Join<Param, Output> = {
    readonly root: (param: Param) => Join_Option<sc.OSignal<Join_Option<Output>>>
    readonly prop: (params: sc.OSignal<Join_Option<Param>>) => sc.OSignal<Join_Option<Output>>
}

export type Join_Atom<Param, Output> = SelectorStatic_Atom<Join<Param, Output>>
