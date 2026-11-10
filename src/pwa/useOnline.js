import { useSyncExternalStore } from 'react'

function subscribe(cb) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => { window.removeEventListener('online', cb); window.removeEventListener('offline', cb) }
}

/** navigator.onLine is only a hint ("connected to a network"); real requests can still fail, and callers must handle that. */
export function useOnline() { return useSyncExternalStore(subscribe, () => navigator.onLine, () => true) }
