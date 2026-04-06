export const iterable_merge = function <T>(a: Iterable<T>, b: Iterable<T>): Iterable<T> {
    return {
        [Symbol.iterator]: function *() {
            yield* a
            yield* b
        }
    }
}
