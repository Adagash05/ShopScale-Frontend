export * from '../../src/components.jsx'
// useLoad answers at once from the mock api so that the static render shows the loaded state.
export function useLoad(fn) { const p = fn(); const v = p && p.__v; return { data: v, error: null, loading: v === undefined, reload() {}, setData() {} } }
