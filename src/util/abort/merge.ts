export const abort_merge = function(signals: readonly (AbortSignal | undefined | false | null)[]): AbortSignal {
    return AbortSignal.any(
        signals.filter(n => typeof n === "object" && n !== null)
    )
}
