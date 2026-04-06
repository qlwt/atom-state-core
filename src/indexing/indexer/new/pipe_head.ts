import { indexer_new_pipe } from "#src/indexing/indexer/new/pipe.js"
import { type IdxRouterF, type Indexer, type Indexer_InferData, type Indexer_InferFilter, type Indexer_InferRef, type IndexerF, type IndexerL } from "#src/indexing/type/indexer.js"

export type Indexer_NewPipeHead_StepsG = readonly IndexerL<any, any, any>[]

export type Indexer_NewPipeHead_Data<Steps extends Indexer_NewPipeHead_StepsG> = readonly [
    ...{
        [K in keyof Steps]: Indexer_InferData<ReturnType<Steps[K]>>
    },
]

export type Indexer_NewPipeHead_Filter<Steps extends Indexer_NewPipeHead_StepsG> = readonly [
    ...{
        [K in keyof Steps]: Indexer_InferFilter<ReturnType<Steps[K]>>
    },
]

export type Indexer_NewPipeHead_IMeta<Steps extends Indexer_NewPipeHead_StepsG> = [
    imeta: any,
    old_data: Indexer_NewPipeHead_Data<Steps> | null,
    now_data: Indexer_NewPipeHead_Data<Steps> | null,
]

export type Indexer_NewPipeHead_FMeta<Steps extends Indexer_NewPipeHead_StepsG> = [
    fmeta: any,
    filter: Indexer_NewPipeHead_Filter<Steps>
]

export type Indexer_NewPipeHead_Ref<Steps extends Indexer_NewPipeHead_StepsG> = (
    Indexer_InferRef<ReturnType<Steps[number]>>
)

export type Indexer_NewPipeHead_Params<Steps extends Indexer_NewPipeHead_StepsG> = {
    readonly steps: Steps
    readonly right_newf: IdxRouterF<Indexer_NewPipeHead_Ref<Steps>, any, any>
}

export const indexer_new_pipe_head = function <Steps extends Indexer_NewPipeHead_StepsG>(
    params: Indexer_NewPipeHead_Params<Steps>
): Indexer<Indexer_NewPipeHead_Ref<Steps>, Indexer_NewPipeHead_Data<Steps>, Indexer_NewPipeHead_Filter<Steps>> {
    return indexer_new_pipe(params) as Indexer<
        Indexer_NewPipeHead_Ref<Steps>,
        Indexer_NewPipeHead_Data<Steps>,
        Indexer_NewPipeHead_Filter<Steps>
    >
}

export const indexer_newf_pipe_head = function <Steps extends Indexer_NewPipeHead_StepsG>(
    params: Indexer_NewPipeHead_Params<Steps>
): IndexerF<Indexer_NewPipeHead_Ref<Steps>, Indexer_NewPipeHead_Data<Steps>, Indexer_NewPipeHead_Filter<Steps>> {
    return () => indexer_new_pipe_head(params)
}

export const indexer_newl_pipe_head = function <Steps extends Indexer_NewPipeHead_StepsG>(
    steps: Steps
): IndexerL<Indexer_NewPipeHead_Ref<Steps>, Indexer_NewPipeHead_Data<Steps>, Indexer_NewPipeHead_Filter<Steps>> {
    return router_new => indexer_new_pipe_head({
        steps,
        right_newf: router_new,
    })
}
