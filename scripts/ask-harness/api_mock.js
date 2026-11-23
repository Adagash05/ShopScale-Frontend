// Answers the way the real server would for one business. Nothing here is shown in production: it only feeds the harness.
export const DATA = {}
const get = (path) => { const v = DATA[path]; const p = Promise.resolve(v); p.__v = v; return p }
export const api = { get, post: get, put: get, del: get }
export class ApiError extends Error {}
