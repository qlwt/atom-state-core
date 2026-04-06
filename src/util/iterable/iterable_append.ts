export const iterable_append = function <T>(a: Iterable<T>, value: T): Iterable<T> {
    return {
        [Symbol.iterator]: function *() {
            yield* a
            yield value
        }
    }
}
