import type { Store } from "#src/store/type/store.js";

export type Value_ApiCache_Config = {
    readonly cleanup?: VoidFunction
}

export type Value_Api<T> = {
    readonly cache: (value: T, config?: Value_ApiCache_Config) => void
}

export type Value_Atom<T = any> = {
    (store: Store, api: Value_Api<T>): T
}
