export const iterable_prepend = function <T>(value: T, a: Iterable<T>): Iterable<T> {
    return {
        [Symbol.iterator]: function *() {
            yield value
            yield* a
        }
    }
}
