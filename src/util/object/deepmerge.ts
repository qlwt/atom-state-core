type Plain = {
    readonly [K in keyof any]?: any
}

export const object_deepmerge = function <A extends Plain, B extends Plain>(left: A, right: B): A & B {
    const result: A = { ...left }

    for (const right_key in right) {
        const right_val = right[right_key]!
        const left_val = left[right_key as unknown as keyof typeof left]!

        if (
            (typeof right_val === "object" && right_val !== null && !Array.isArray(right_val))
            && (typeof left_val === "object" && left_val !== null && !Array.isArray(left_val))
        ) {
            result[right_key] = object_deepmerge(left_val, right_val) as any
        } else {
            result[right_key] = right_val as any
        }
    }

    return result as A & B
}
