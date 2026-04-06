import { Join_Option_Kind, type Join_Option } from "#src/join/type/join.js";

export type Join_OptionGet_Params<Out, Fallback> = {
    readonly option: Join_Option<Out>
    readonly fallback: Fallback
}

export const join_option_get = function <Out, Fallback>(params: Join_OptionGet_Params<Out, Fallback>): Out | Fallback {
    switch (params.option.kind) {
        case Join_Option_Kind.None:
            return params.fallback
        case Join_Option_Kind.View:
            return params.option.value
    }
}
