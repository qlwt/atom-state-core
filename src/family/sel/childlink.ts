import type { Family_Atom } from "#src/family/type/family.js"
import type { SelectorStatic_Atom } from "#src/selector/type/selector.js"

export const family_sel_childlink = function <Index, V>(family: Family_Atom<Index, V>): SelectorStatic_Atom<(index: Index) => V> {
    return ({ reg }) => {
        return index_raw => {
            const family_v = reg(family)

            return family_v.reg(index_raw)
        }
    }
}
