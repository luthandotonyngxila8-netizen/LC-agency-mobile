import { describe, expect, it } from 'vitest'
import { subDays, subHours, subMinutes, subSeconds } from 'date-fns'
import { noteAge } from './format'

describe('noteAge', () => {
  const now = new Date('2026-08-02T12:00:00.000Z')

  it('reads as "Just now" for a note written moments ago', () => {
    expect(noteAge(now, now)).toBe('Just now')
    expect(noteAge(subSeconds(now, 59), now)).toBe('Just now')
  })

  it('switches to a relative distance once past a minute', () => {
    expect(noteAge(subSeconds(now, 60), now)).toBe('1 minute ago')
    expect(noteAge(subMinutes(now, 5), now)).toBe('5 minutes ago')
  })

  it('scales up to hours and days', () => {
    expect(noteAge(subHours(now, 3), now)).toBe('3 hours ago')
    expect(noteAge(subDays(now, 2), now)).toBe('2 days ago')
  })
})
