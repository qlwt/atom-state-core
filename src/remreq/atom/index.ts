import { remreq_new } from "#src/remreq/new/index.js"
import type { AtomRemReq } from "#src/remreq/type/State.js"
import { atomvalue_new } from "#src/value/atom/index.js"

export const atomremreq_new = function <Data>(): AtomRemReq<Data> {
    return atomvalue_new(() => {
        return remreq_new()
    })
}
