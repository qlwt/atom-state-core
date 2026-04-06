import type { PartialDeep } from "#src/type/object.js"

type Plain = Record<string, unknown>

function status_record_new(value: unknown): value is Plain {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function object_deepassign<T extends {}>(target: T, ...src_list: PartialDeep<T>[]): T {
    for (const src of src_list) {
        for (const [src_key, src_value] of Object.entries(src) as [keyof T, T[keyof T]][]) {
            const target_value = target[src_key]

            if (status_record_new(target_value) && status_record_new(src_value)) {
                object_deepassign(target_value, src_value as PartialDeep<T[keyof T] & Plain>)

                continue
            }

            target[src_key] = src_value
        }
    }

    return target
}
