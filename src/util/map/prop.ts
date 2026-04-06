export const map_prop_truthy = function <K, V>(map: Map<K, V>, key: K, value: V): V {
    let result = map.get(key)

    if (!result) {
        result = value

        map.set(key, result)
    }

    return result
}

export const map_prop_falsy = function <K, V>(map: Map<K, V>, key: K, value: V): V {
    let result

    if (!map.has(key)) {
        result = value

        map.set(key, result)

        return result
    }

    return map.get(key)!
}

export const map_prop_truthy_coerce = function <K, V, R extends V>(map: Map<K, V>, key: K, value: R): R {
    let result = map.get(key)

    if (!result) {
        result = value

        map.set(key, result)
    }

    return result as R
}

export const map_prop_falsy_coerce = function <K, V, R extends V>(map: Map<K, V>, key: K, value: R): R {
    let result

    if (!map.has(key)) {
        result = value

        map.set(key, result)

        return result
    }

    return map.get(key)! as R
}

export const map_lprop_truthy = function <K, V>(map: Map<K, V>, key: K, value_new: () => V): V {
    let result = map.get(key)

    if (!result) {
        result = value_new()

        map.set(key, result)
    }

    return result
}

export const map_lprop_falsy = function <K, V>(map: Map<K, V>, key: K, value_new: () => V): V {
    let result

    if (!map.has(key)) {
        result = value_new()

        map.set(key, result)

        return result
    }

    return map.get(key)!
}

export const map_lprop_truthy_coerce = function <K, V, R extends V>(map: Map<K, V>, key: K, value_new: () => R): R {
    let result = map.get(key)

    if (!result) {
        result = value_new()

        map.set(key, result)
    }

    return result as R
}

export const map_lprop_falsy_coerce = function <K, V, R extends V>(map: Map<K, V>, key: K, value_new: () => R): R {
    let result

    if (!map.has(key)) {
        result = value_new()

        map.set(key, result)

        return result
    }

    return map.get(key)! as R
}
