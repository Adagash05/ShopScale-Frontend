export const STATUS = {
  ENQUIRY: 'Enquiry', QUOTED: 'Quotation sent', BOOKED: 'Booked', IN_PREPARATION: 'In preparation', READY: 'Ready', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
}
export const TONE = { ENQUIRY: 'warn', QUOTED: 'warn', BOOKED: '', IN_PREPARATION: 'teal', READY: 'ok', COMPLETED: 'ok', CANCELLED: 'gray' }
export const METHODS = { CASH: 'Cash', TRANSFER: 'Bank transfer', CARD: 'Card' }
export const USAGE = { EXTRA: 'Used more than planned', RETURN: 'Unused, came back', WASTE: 'Wasted' }

export function timeText(t) { return t ? String(t).slice(0, 5) : '' }
