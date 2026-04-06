import { Join_Option_Kind, type Join_Option } from "#src/join/type/join.js";

export const join_option_expect = function <Out>(src: Join_Option<Out>): Out {
    switch (src.kind) {
        case Join_Option_Kind.None:
            throw new Error(`Expected option to be non-nullish`)
        case Join_Option_Kind.View:
            return src.value
    }
}
