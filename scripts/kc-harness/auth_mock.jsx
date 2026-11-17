export const PERMS = { current: new Set() }
export const useAuth = () => ({ can: (p) => PERMS.current.has(p), hasFeature: () => true, hasWorkflow: () => true, user: { name: 'Ada' } })
export const AuthProvider = ({ children }) => children
