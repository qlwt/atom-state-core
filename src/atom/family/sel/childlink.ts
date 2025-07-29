import type { AtomFamily } from "#src/atom/family/type/AtomFamily.js"
import type { AtomSelectorStatic } from "#src/atom/selector/type/AtomSelector.js"

export const atomfamily_sel_childlink = function <Index, V>(family: AtomFamily<Index, V>): AtomSelectorStatic<(index: Index) => V> {
    return ({ reg }) => {
        return index_raw => {
            const family_v = reg(family)

            return family_v.reg(index_raw)
        }
    }
}
