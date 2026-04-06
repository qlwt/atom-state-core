import { Indexer_EventKind, type IdxRouter, type Indexer, type Indexer_InferData, type Indexer_InferFilter, type Indexer_InferRef, type IndexerF, type IndexerL } from "#src/indexing/type/indexer.js"

export type Indexer_NewPipe_StepsG = readonly IndexerL<any, any, any>[]

export type Indexer_NewPipe_Data<Steps extends Indexer_NewPipe_StepsG, RData> = readonly [
    ...{
        [K in keyof Steps]: Indexer_InferData<ReturnType<Steps[K]>>
    },
    RData
]

export type Indexer_NewPipe_Filter<Steps extends Indexer_NewPipe_StepsG, RFilter> = readonly [
    ...{
        [K in keyof Steps]: Indexer_InferFilter<ReturnType<Steps[K]>>
    },
    RFilter
]

export type Indexer_NewPipe_IMeta<Steps extends Indexer_NewPipe_StepsG, RData> = [
    imeta: any,
    old_data: Indexer_NewPipe_Data<Steps, RData> | null,
    now_data: Indexer_NewPipe_Data<Steps, RData> | null,
]

export type Indexer_NewPipe_FMeta<Steps extends Indexer_NewPipe_StepsG, RFilter> = [
    fmeta: any,
    filter: Indexer_NewPipe_Filter<Steps, RFilter>
]

export type Indexer_NewPipe_Ref<Steps extends Indexer_NewPipe_StepsG> = (
    Indexer_InferRef<ReturnType<Steps[number]>>
)

type Router_NewStep_Params<Steps extends Indexer_NewPipe_StepsG, RData, RFilter> = {
    readonly steps: Steps
    readonly index: number
    readonly right_newf: IndexerF<Indexer_NewPipe_Ref<Steps>, RData, RFilter>
}

const router_new_step = function <Steps extends Indexer_NewPipe_StepsG, RData, RFilter>(
    params: Router_NewStep_Params<Steps, RData, RFilter>
): IdxRouter<Indexer_NewPipe_Ref<Steps>, Indexer_NewPipe_IMeta<Steps, RData>, Indexer_NewPipe_FMeta<Steps, RFilter>> {
    if (params.index < params.steps.length) {
        const next = params.steps[params.index]!(() => router_new_step({
            steps: params.steps,
            index: params.index + 1,
            right_newf: params.right_newf,
        }))

        return {
            filter: fev => {
                return next.filter([
                    fev[0],
                    fev[0][1][params.index]!,
                ])
            },

            input_add: (ref, meta) => {
                next.input_add(ref, meta, meta[2]![params.index]!)
            },

            input_delete: (ref, meta) => {
                next.input_delete(ref, meta, meta[1]![params.index])
            },

            input_update: (ref, meta) => {
                next.input_update(ref, meta, meta[1]![params.index], meta[2]![params.index])
            },

            input: evs => {
                next.input(evs.map(ev => {
                    switch (ev[0]) {
                        case Indexer_EventKind.Delete:
                            return [ev[0], ev[1], ev[2], ev[2][1]![params.index], null]
                        case Indexer_EventKind.Update:
                            return [ev[0], ev[1], ev[2], ev[2][1]![params.index], ev[2][2]![params.index]]
                        case Indexer_EventKind.Add:
                            return [ev[0], ev[1], ev[2], null, ev[2][2]![params.index]]
                    }
                }))
            }
        }
    }

    {
        const next = params.right_newf()

        return {
            filter: fev => {
                return next.filter([fev[0][0], fev[0][1][params.index]!])
            },

            input_add: (ref, meta) => {
                next.input_add(ref, meta[0], meta[2]![params.index]!)
            },

            input_delete: (ref, meta) => {
                next.input_delete(ref, meta[0], meta[1]![params.index])
            },

            input_update: (ref, meta) => {
                next.input_update(ref, meta[0], meta[1]![params.index], meta[2]![params.index])
            },

            input: evs => {
                next.input(evs.map(ev => {
                    switch (ev[0]) {
                        case Indexer_EventKind.Add:
                            return [ev[0], ev[1], ev[2][0], null, ev[2][2]![params.index]!]
                        case Indexer_EventKind.Delete:
                            return [ev[0], ev[1], ev[2][0], ev[2][1]![params.index]!, null]
                        case Indexer_EventKind.Update:
                            return [ev[0], ev[1], ev[2][0], ev[2][1]![params.index]!, ev[2][2]![params.index]!]
                    }
                }))
            },
        }
    }
}

export type Indexer_NewPipe_Params<Steps extends Indexer_NewPipe_StepsG, RData, RFilter> = {
    readonly steps: Steps
    readonly right_newf: IndexerF<Indexer_NewPipe_Ref<Steps>, RData, RFilter>
}

export const indexer_new_pipe = function <Steps extends Indexer_NewPipe_StepsG, RData, RFilter>(
    params: Indexer_NewPipe_Params<Steps, RData, RFilter>
): Indexer<Indexer_NewPipe_Ref<Steps>, Indexer_NewPipe_Data<Steps, RData>, Indexer_NewPipe_Filter<Steps, RFilter>> {
    const step = router_new_step({
        index: 0,
        steps: params.steps,
        right_newf: params.right_newf,
    })

    return {
        filter: fev => {
            return step.filter([fev, undefined])
        },

        input_add: (ref, meta, data) => {
            step.input_add(ref, [meta, null, data])
        },

        input_delete: (ref, meta, old_data) => {
            step.input_delete(ref, [meta, old_data, null])
        },

        input_update: (ref, meta, old_data, now_data) => {
            step.input_update(ref, [meta, old_data, now_data])
        },

        input: evs => {
            step.input(evs.map(ev => {
                switch (ev[0]) {
                    case Indexer_EventKind.Delete:
                        return [ev[0], ev[1], [ev[2], ev[3], ev[4]], null, null]
                    case Indexer_EventKind.Update:
                        return [ev[0], ev[1], [ev[2], ev[3], ev[4]], null, null]
                    case Indexer_EventKind.Add:
                        return [ev[0], ev[1], [ev[2], ev[3], ev[4]], null, null]
                }
            }))
        }
    }
}

export const indexer_newf_pipe = function <Steps extends Indexer_NewPipe_StepsG, RData, RFilter>(
    params: Indexer_NewPipe_Params<Steps, RData, RFilter>
): IndexerF<Indexer_NewPipe_Ref<Steps>, Indexer_NewPipe_Data<Steps, RData>, Indexer_NewPipe_Filter<Steps, RFilter>> {
    return () => indexer_new_pipe(params)
}
