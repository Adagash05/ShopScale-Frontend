export const STATE = { perms: new Set(), features: new Set() }
export const useAuth = () => ({ can: (p) => STATE.perms.has(p), hasFeature: (f) => STATE.features.has(f), business: { name: 'Ada Stores' } })
