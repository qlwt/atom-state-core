import { remreq_new } from "#src/remreq/new/index.js"
import type { RemReq_Atom } from "#src/remreq/type/state.js"
import { value_atom } from "#src/value/atom/index.js"

export const remreq_atom = function <Data>(): RemReq_Atom<Data> {
    return value_atom(() => {
        return remreq_new()
    })
}
