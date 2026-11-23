import React from 'react'
export * from '../../src/components.jsx'
export function useLoad(fn) {
  const p = fn()
  const v = p && p.__v
  return { data: v, error: null, loading: v === undefined, reload() {}, setData() {} }
}
