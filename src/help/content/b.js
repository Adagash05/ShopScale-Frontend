// Tiny helpers so articles read like documents. **bold** and [label](/path) work inside any text.
export const p = (text) => ({ t: 'p', text })
export const h = (text) => ({ t: 'h', text })
export const steps = (...items) => ({ t: 'steps', items })
export const list = (...items) => ({ t: 'list', items })
export const tip = (text) => ({ t: 'tip', text })
export const warn = (text) => ({ t: 'warn', text })
/** A real screenshot: /help/shots/<id>.png. Shown only when that file exists (see docs/HELP_SCREENSHOTS.md). */
export const shot = (id, caption) => ({ t: 'shot', id, caption })
/** A labelled illustration built from the real interface styles with sample data. */
export const illus = (name) => ({ t: 'illus', name })
export const article = (id, title, desc, blocks, extra = {}) => ({ id, title, desc, blocks, ...extra })
