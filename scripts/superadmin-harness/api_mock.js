import { FIX } from './fixtures.js'
const get = (path, q) => { const v = FIX(path, q); const p = Promise.resolve(v); p.__v = v; return p }
export const api = { get, post: get, put: get, del: get, download: get, public: { get, post: get } }
export const request = get
export class ApiError extends Error {}
