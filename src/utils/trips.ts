import { DiveTrip } from '../types/dive';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Formats a trip title like "Bali 2026"
 */
export function formatTripTitle(trip: DiveTrip): string {
  const year = trip.startDate.slice(0, 4);
  if (trip.destination.includes(year)) {
    return trip.destination;
  }
  return `${trip.destination} ${year}`;
}

/**
 * Formats a trip date range like "10–20 Nov 2026" or "28 Oct – 3 Nov 2026"
 */
export function formatTripDateRange(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return startDate || '';
  const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

  const sM = SHORT_MONTHS[(sMonth || 1) - 1] || '';
  const eM = SHORT_MONTHS[(eMonth || 1) - 1] || '';

  if (sYear === eYear && sMonth === eMonth) {
    if (sDay === eDay) {
      return `${sDay} ${sM} ${sYear}`;
    }
    return `${sDay}–${eDay} ${sM} ${sYear}`;
  }
  if (sYear === eYear) {
    return `${sDay} ${sM} – ${eDay} ${eM} ${sYear}`;
  }
  return `${sDay} ${sM} ${sYear} – ${eDay} ${eM} ${eYear}`;
}

/**
 * Finds a trip whose [startDate, endDate] range includes the given diveDate (YYYY-MM-DD)
 */
export function findMatchingTripForDate(
  diveDate: string,
  trips: DiveTrip[]
): DiveTrip | undefined {
  if (!diveDate) return undefined;
  return trips.find(
    (trip) => diveDate >= trip.startDate && diveDate <= trip.endDate
  );
}
