/** Notifications saved before the route fix carry old destinations; map them to pages that exist. */
const LEGACY_LINKS = { '/stock': '/more/stock', '/more/restaurant': '/sell' }
export const notificationLink = (link) => (link ? (LEGACY_LINKS[link] || link) : link)
