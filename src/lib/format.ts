import { differenceInSeconds, formatDistanceStrict } from 'date-fns'

/**
 * How a note's age reads in the list.
 *
 * Strict distance on its own renders a note written a moment ago as "0 seconds
 * ago", which looks broken next to one the user just typed.
 *
 * Takes `now` explicitly rather than using the `…ToNow` helpers, so the whole
 * function is driven by one clock and can be tested at a fixed instant.
 */
export function noteAge(written: Date, now: Date = new Date()): string {
  if (differenceInSeconds(now, written) < 60) return 'Just now'
  return formatDistanceStrict(written, now, { addSuffix: true })
}
