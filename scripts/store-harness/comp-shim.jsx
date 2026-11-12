import { useCallback, useEffect, useState } from 'react'
export function useLoad(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const run = useCallback(() => { let live = true; setState((s) => ({ ...s, loading: true, error: null })); fn().then((data) => { if (live) setState({ data, error: null, loading: false }) }, (error) => { if (live) setState({ data: null, error, loading: false }) }); return () => { live = false } }, deps)
  useEffect(() => run(), [run])
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) }
}
