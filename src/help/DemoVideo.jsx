import { useState } from 'react'

/**
 * The one-minute product demonstration. It is a real recording of the running app with demo data
 * (scripts/record-demo-video.mjs) saved at public/demo/. The section appears only when that file exists, so nothing is shown
 * (no empty player, no placeholder) until the recording has been made.
 */
export default function DemoVideo({ title = 'See ShopScale in one minute' }) {
  const [ok, setOk] = useState(false)
  return (
    <section className="hc-demo" aria-label={title} hidden={!ok}>
      <h2>{title}</h2>
      <p>A short walkthrough of a sample business (Aminu Stores) using ShopScale: products, selling, the online store and orders. All names and figures are fictional.</p>
      <video controls playsInline preload="metadata" onLoadedMetadata={() => setOk(true)} onError={() => setOk(false)}>
        <source src="/demo/shopscale-demo.webm" type="video/webm" onError={() => setOk(false)} />
        <source src="/demo/shopscale-demo.mp4" type="video/mp4" />
        Your browser cannot play this video.
      </video>
    </section>
  )
}
