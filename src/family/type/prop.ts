import type { Store } from "#src/store/type/store.js";
import type { Value_Api, Value_ApiCache_Config, Value_Atom } from "#src/value/type/value.js";

export interface Family_Prop_ApiCache_Config extends Value_ApiCache_Config {
}

export interface Family_Prop_Api<V> extends Value_Api<V> {
    readonly cache: (value: V, config?: Family_Prop_ApiCache_Config) => void
}

export interface Family_Prop<V> extends Value_Atom<V> {
    (store: Store, api: Family_Prop_Api<V>): V
}
