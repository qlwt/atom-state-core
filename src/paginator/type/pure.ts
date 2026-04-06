import type { Paginator_Status } from "#src/paginator/type/status.js"
import * as sc from "@qyu/signal-core"

export type PaginatorPure = {
    readonly load: () => void
    readonly clear: () => void
    readonly status: sc.OSignal<Paginator_Status>
}
