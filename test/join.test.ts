import { family_atom_hash, remnode_atom, ReqState_Status, store_new } from "#src/index.js";
import { join_new_fallbacko } from "#src/join/new/fallbacko.js";
import { join_new_filtero_withdata, join_newf_filtero_withdata } from "#src/join/new/filtero_withdata.js";
import { join_newf_list } from "#src/join/new/list.js";
import { join_newf_listflat } from "#src/join/new/listflat.js";
import { join_newf_pipei } from "#src/join/new/pipei.js";
import { join_newf_pipei_data } from "#src/join/new/pipei_data.js";
import { join_newf_pipeo } from "#src/join/new/pipeo.js";
import { join_newf_pipeo_expdata } from "#src/join/new/pipeo_expdata.js";
import { join_newf_remdata } from "#src/join/new/remdata.js";
import { join_newf_remdata_merge } from "#src/join/new/remdata_merge.js";
import { join_new_remnode, join_newf_remnode } from "#src/join/new/remnode.js";
import { join_new_remnode_merge } from "#src/join/new/remnode_merge.js";
import { join_option_expect } from "#src/join/option/expect.js";
import { join_option_get } from "#src/join/option/get.js";
import * as sc from "@qyu/signal-core";
import { assert, test } from "vitest";

test("join core", async () => {
    type Def = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<Def>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)

    const join = join_new_remnode({
        link_new: (id: number) => fam_root.reg(id),
        joins: {} as const,
    })

    const join_inst = sc.osignal_new_pipe(join_option_expect(join.root(0)), join_option_expect)

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push({
        data: null,

        meta: {
            error: null,
            source: "direct",
            statics: { id: 0 }
        },
    })

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 10
        }
    })

    expectation.push({
        data: {
            joins: {},

            core: {
                id: 0,
                value: 10,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join child", async () => {
    type DefRoot = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            child_id: number
        }
    }

    type DefChild = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefRoot>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const afam_child = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefChild>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)
    const fam_child = store.reg(afam_child)

    const join = join_new_remnode({
        link_new: (id: number) => fam_root.reg(id),

        joins: {
            child: join_newf_pipei_data({
                transformer: param => param.child_id,

                join: join_newf_remdata({
                    link_new: (id: number) => fam_child.reg(id),
                    joins: {},
                }),
            } as const)
        } as const,
    })

    const join_inst = sc.osignal_new_pipe(
        join_option_expect(join.root(0)),
        src => join_option_get({ option: src, fallback: null })
    )

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push(null)

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            child_id: 0,
        }
    })

    expectation.push({
        data: {
            core: {
                id: 0,
                child_id: 0,
            },

            joins: {
                child: null,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    fam_child.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 100
        }
    })

    expectation.push({
        data: {
            joins: {
                child: {
                    core: {
                        id: 0,
                        value: 100,
                    },

                    joins: {},
                }
            },

            core: {
                id: 0,
                child_id: 0,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join core merge", async () => {
    type Def = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<Def>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)

    const join = join_new_remnode_merge({
        link_new: (id: number) => fam_root.reg(id),
        joins: {} as const,
    })

    const join_inst = sc.osignal_new_pipe(join_option_expect(join.root(0)), join_option_expect)

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push({
        data: null,

        meta: {
            error: null,
            source: "direct",
            statics: { id: 0 }
        },
    })

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 10
        }
    })

    expectation.push({
        data: {
            id: 0,
            value: 10,
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join child merge", async () => {
    type DefRoot = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            child_id: number
        }
    }

    type DefChild = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefRoot>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const afam_child = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefChild>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)
    const fam_child = store.reg(afam_child)

    const join = join_new_remnode_merge({
        link_new: (id: number) => fam_root.reg(id),

        joins: {
            child_id: join_newf_pipei_data({
                transformer: param => param.child_id,

                join: join_newf_remdata_merge({
                    link_new: (id: number) => fam_child.reg(id),
                    joins: {},
                }),
            } as const)
        } as const,
    })

    const join_inst = sc.osignal_new_pipe(
        join_option_expect(join.root(0)),
        src => join_option_get({ option: src, fallback: null })
    )

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push(null)

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            child_id: 0,
        }
    })

    expectation.push({
        data: {
            id: 0,
            child_id: null
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    fam_child.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 100
        }
    })

    expectation.push({
        data: {
            id: 0,
            child_id: {
                id: 0,
                value: 100,
            }
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join list", async () => {
    type DefRoot = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            children_id: number[]
        }
    }

    type DefChild = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefRoot>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const afam_child = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefChild>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)
    const fam_child = store.reg(afam_child)

    // precreate to prevent unnecessary updates
    fam_child.reg(0)
    fam_child.reg(1)

    const join = join_new_remnode({
        link_new: (id: number) => fam_root.reg(id),

        joins: {
            children: join_newf_pipei_data({
                transformer: param => param.children_id,

                join: join_newf_list({
                    join: join_newf_remnode({
                        link_new: (id: number) => fam_child.reg(id),
                        joins: {},
                    }),
                } as const),
            } as const)
        } as const,
    })

    const join_inst = sc.osignal_new_pipe(
        join_option_expect(join.root(0)),
        src => join_option_get({ option: src, fallback: null })
    )

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push(null)

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            children_id: [0, 1],
        }
    })

    expectation.push({
        data: {
            core: {
                id: 0,
                children_id: [0, 1],
            },

            joins: {
                children: [
                    {
                        data: null,

                        meta: {
                            error: null,
                            source: "direct",
                            statics: { id: 0 }
                        },
                    },
                    {
                        data: null,

                        meta: {
                            error: null,
                            source: "direct",
                            statics: { id: 1 }
                        },
                    },
                ],
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    fam_child.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 100
        }
    })

    expectation.push({
        data: {
            joins: {
                children: [
                    {
                        data: {
                            core: {
                                id: 0,
                                value: 100,
                            },

                            joins: {},
                        },

                        meta: {
                            source: "direct",
                            statics: { id: 0 }
                        },
                    },
                    {
                        data: null,

                        meta: {
                            error: null,
                            source: "direct",
                            statics: { id: 1 }
                        },
                    },
                ]
            },

            core: {
                id: 0,
                children_id: [0, 1],
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join listflat", async () => {
    type DefRoot = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
        }
    }

    type DefChild = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()
    const children_id = sc.signal_new_value([0, 1])

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefRoot>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const afam_child = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefChild>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)
    const fam_child = store.reg(afam_child)

    // precreate to prevent unnecessary updates
    fam_child.reg(0)
    fam_child.reg(1)

    const join = join_new_remnode({
        link_new: (id: number) => fam_root.reg(id),

        joins: {
            children: join_newf_pipei({
                transformer: () => children_id,

                join: join_newf_listflat({
                    join: join_newf_remnode({
                        link_new: (id: number) => fam_child.reg(id),
                        joins: {},
                    }),
                } as const),
            } as const)
        } as const,
    })

    const join_inst = sc.osignal_new_pipe(
        join_option_expect(join.root(0)),
        src => join_option_get({ option: src, fallback: null })
    )

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push({
        data: null,

        meta: {
            error: null,
            source: "direct",
            statics: { id: 0 }
        },
    })

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
        }
    })

    expectation.push({
        data: {
            core: {
                id: 0,
            },

            joins: {
                children: [
                    {
                        data: null,

                        meta: {
                            error: null,
                            source: "direct",
                            statics: { id: 0 }
                        },
                    },
                    {
                        data: null,

                        meta: {
                            error: null,
                            source: "direct",
                            statics: { id: 1 }
                        },
                    },
                ],
            },

        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    fam_child.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 100
        }
    })

    expectation.push({
        data: {
            joins: {
                children: [
                    {
                        data: {
                            core: {
                                id: 0,
                                value: 100,
                            },

                            joins: {},
                        },

                        meta: {
                            source: "direct",
                            statics: { id: 0 }
                        },
                    },
                    {
                        data: null,

                        meta: {
                            error: null,
                            source: "direct",
                            statics: { id: 1 }
                        },
                    },
                ]
            },

            core: {
                id: 0,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join pipe", async () => {
    type DefRoot = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            child_id: number
        }
    }

    type DefChild = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefRoot>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const afam_child = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefChild>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)
    const fam_child = store.reg(afam_child)

    const join = join_new_remnode({
        link_new: (id: number) => fam_root.reg(id),

        joins: {
            child: join_newf_pipei_data({
                transformer: param => param.child_id,

                join: join_newf_pipeo({
                    transformer: output => output.data,

                    join: join_new_remnode({
                        link_new: (id: number) => fam_child.reg(id),
                        joins: {},
                    }),
                }),
            })
        },
    })

    const join_inst = sc.osignal_new_pipe(
        join_option_expect(join.root(0)),
        src => join_option_get({ option: src, fallback: null })
    )

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push(null)

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            child_id: 0,
        }
    })

    expectation.push({
        data: {
            core: {
                id: 0,
                child_id: 0,
            },

            joins: {
                child: null,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    fam_child.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 100
        }
    })

    expectation.push({
        data: {
            joins: {
                child: {
                    core: {
                        id: 0,
                        value: 100,
                    },

                    joins: {},
                },
            },

            core: {
                id: 0,
                child_id: 0,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join pipe_expdata", async () => {
    type DefRoot = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            child_id: number
        }
    }

    type DefChild = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefRoot>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const afam_child = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefChild>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)
    const fam_child = store.reg(afam_child)

    const join = join_new_remnode({
        link_new: (id: number) => fam_root.reg(id),

        joins: {
            child: join_newf_pipei_data({
                transformer: param => param.child_id,

                join: join_newf_pipeo_expdata({
                    join: join_newf_remnode({
                        link_new: (id: number) => fam_child.reg(id),
                        joins: {},
                    })
                }),
            } as const)
        } as const,
    })

    const join_inst = sc.osignal_new_pipe(
        join_option_expect(join.root(0)),
        src => join_option_get({ option: src, fallback: null })
    )

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push(null)

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            child_id: 0,
        }
    })

    expectation.push(null)

    fam_child.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 100
        }
    })

    expectation.push({
        data: {
            joins: {
                child: {
                    core: {
                        id: 0,
                        value: 100,
                    },

                    joins: {},
                },
            },

            core: {
                id: 0,
                child_id: 0,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join filter_fullnode", async () => {
    type Def = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<Def>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)

    const join = join_new_filtero_withdata({
        join: join_newf_remnode({
            link_new: (id: number) => fam_root.reg(id),
            joins: {} as const,
        })
    })

    const join_inst = sc.osignal_new_pipe(
        join_option_expect(join.root(0)),
        src => join_option_get({ option: src, fallback: null })
    )

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push(null)

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 10
        }
    })

    expectation.push({
        data: {
            joins: {},

            core: {
                id: 0,
                value: 10,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})

test("join fallback", async () => {
    type DefRoot = {
        request_meta: any
        request_result: any

        statics: {
            id: number
        }

        data: {
            id: number
            value: number
        }
    }

    const outputs: any[] = []
    const expectation: any[] = []

    const store = store_new()

    const afam_root = family_atom_hash(() => ({
        key: (id: number) => id,

        get: (id: number) => {
            return remnode_atom<DefRoot>(() => ({
                init: null,
                statics: { id },
            }))
        }
    }))

    const fam_root = store.reg(afam_root)

    const join = join_new_fallbacko({
        fallback: 0,

        join: join_newf_filtero_withdata({
            join: join_newf_remnode({
                link_new: (id: number) => fam_root.reg(id),
                joins: {} as const,
            })
        }),
    })

    const join_inst = sc.osignal_new_pipe(
        join_option_expect(join.root(0)),
        src => join_option_expect(src)
    )

    join_inst.addsub(() => {
        outputs.push(join_inst.output())
    })

    outputs.push(join_inst.output())

    expectation.push(0)

    fam_root.reg(0).real.input({
        status: ReqState_Status.Fulfilled,
        data: {
            id: 0,
            value: 10
        }
    })

    expectation.push({
        data: {
            joins: {},

            core: {
                id: 0,
                value: 10,
            },
        },

        meta: {
            source: "direct",
            statics: { id: 0 }
        },
    })

    assert.deepStrictEqual(outputs, expectation)
})
