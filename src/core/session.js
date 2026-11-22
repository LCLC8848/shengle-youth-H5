import { reactive } from 'vue'
import { options } from './options.js'
import { steps } from './content.js'

const storageKey = 'shengle-h5:v1'
const empty = () => ({
  answers: { status: '', partner: '', attitude: '' },
  photoEnabled: false, photo: '', photoConfirmed: false, revealed: false,
})
function restore() {
  const next = empty()
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null')
    if (!saved) return next
    for (const { key } of steps) {
      if (!options[key].some(o => o.id === saved.answers?.[key])) break
      next.answers[key] = saved.answers[key]
    }
    next.photoEnabled = saved.photoEnabled === true
    next.photo = next.photoEnabled && typeof saved.photo === 'string' &&
      /^data:image\/jpeg;base64,/.test(saved.photo) && saved.photo.length < 1800000 ? saved.photo : ''
    next.photoConfirmed = saved.photoConfirmed === true && allAnswered(next) && (!next.photoEnabled || !!next.photo)
    next.revealed = next.photoConfirmed && saved.revealed === true
  } catch { /* Private browsing may disable session storage. */ }
  return next
}
function allAnswered(record) { return steps.every(s => !!record.answers[s.key]) }
export const session = reactive(restore())
export function persist() {
  try { sessionStorage.setItem(storageKey, JSON.stringify(session)) }
  catch {
    // If storage fills, retain this in-memory run. Avoid restoring an older portrait on refresh.
    try { sessionStorage.removeItem(storageKey) } catch { /* Storage is unavailable. */ }
  }
}
export function choose(key, id) {
  if (!options[key]?.some(o => o.id === id)) return
  if (session.answers[key] !== id) {
    session.answers[key] = id
    session.photoConfirmed = false
    session.revealed = false
  }
  persist()
}
export function setPhoto(enabled, data = '') {
  session.photoEnabled = enabled
  session.photo = enabled ? data : ''
  session.photoConfirmed = false
  session.revealed = false
  persist()
}
export function confirmPhoto() {
  if (session.photoEnabled && !session.photo) return false
  session.photoConfirmed = true
  persist()
  return true
}
export function markRevealed() { session.revealed = true; persist() }
export function restart() { Object.assign(session, empty()); persist() }
export function selectedOptions() {
  return steps.map(({ key }) => options[key].find(o => o.id === session.answers[key])).filter(Boolean)
}
export function resultTheme() {
  const selected = selectedOptions()
  const score = new Map()
  selected.forEach(o => score.set(o.theme, (score.get(o.theme) || 0) + 1))
  // On a three-way tie prefer the attitude, then partner, then status.
  return selected.slice().reverse().sort((a, b) => score.get(b.theme) - score.get(a.theme))[0]?.theme || 'blue'
}

