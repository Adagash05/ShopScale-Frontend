import React from 'react'
const mk = (n) => ({ size = 24, ...p }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" data-icon={n} {...p}><circle cx="12" cy="12" r="8" /></svg>
export const Mail = mk('Mail'), MapPin = mk('MapPin'), MessageCircle = mk('MessageCircle'), Package = mk('Package'), Phone = mk('Phone'), Search = mk('Search'), ShoppingBag = mk('ShoppingBag'), Menu = mk('Menu'), X = mk('X'), Minus = mk('Minus'), Plus = mk('Plus')
