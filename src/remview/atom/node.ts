import type { RemNode_Atom, RemNode_Def } from "#src/remnode/type/def.js";
import { remview_new_node } from "#src/remview/new/node.js";
import type { RemView } from "#src/remview/type/view.js";
import type { SelectorDynamic_Atom } from "#src/selector/type/selector.js";

export const remview_atom_node = function <Def extends RemNode_Def>(
    remnode_atom: RemNode_Atom<Def>
): SelectorDynamic_Atom<RemView<Def>> {
    return ({ reg }) => {
        const remnode = reg(remnode_atom)

        return remview_new_node(remnode)
    }
}
