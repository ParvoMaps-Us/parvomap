'use client'
import { useEffect } from 'react'

// Flags whether the user is navigating by keyboard, as <html class="user-tabbing">.
// CSS uses this to reveal the skip link ONLY for real keyboard users — iOS Safari
// otherwise treats the focus Next.js places on the skip link after a client-side
// navigation as :focus-visible, making it flash on screen (e.g. arriving from the
// recalls "View the outbreak map" link). A pure-CSS :focus-visible rule can't
// distinguish that programmatic focus on Safari, so we gate it on actual Tab use.
export default function KeyboardModality() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab') document.documentElement.classList.add('user-tabbing')
    }
    function onPointer() {
      document.documentElement.classList.remove('user-tabbing')
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('touchstart', onPointer)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('touchstart', onPointer)
    }
  }, [])
  return null
}
