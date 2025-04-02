import { reqphase_new_empty } from "#src/request-phase/new/empty.js";
import { reqphase_new_fulfilled } from "#src/request-phase/new/fulfilled.js";
import { reqphase_new_pending } from "#src/request-phase/new/pending.js";
import { RequestPhase_Status, type RequestPhase } from "#src/request-phase/type/RequestPhase.js";

type RequestPhase_New_Pipe_Params<I, O> = {
    readonly src: RequestPhase<I>
    readonly pipe: (data: I) => O
}

export const reqphase_new_pipe = function <I, O>(params: RequestPhase_New_Pipe_Params<I, O>): RequestPhase<O> {
    const { src, pipe } = params

    switch (src.status) {
        case RequestPhase_Status.Empty: {
            return reqphase_new_empty()
        }
        case RequestPhase_Status.Pending: {
            return reqphase_new_pending({
                abort: () => { src.abort() },
                promise: src.promise.then(next_reqphase => reqphase_new_pipe({
                    pipe: pipe,
                    src: next_reqphase,
                }))
            })
        }
        case RequestPhase_Status.Fulfilled: {
            return reqphase_new_fulfilled(pipe(src.data))
        }
    }
}
