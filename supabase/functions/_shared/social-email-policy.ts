// Only the trusted social enrollment worker may omit email for a free course.
export function allowsMissingSocialEmail(supplied: string | null, expected: string | undefined, price: unknown, amount: unknown): boolean {
  return !!expected && supplied === expected && price !== null && price !== undefined && Number(price) === 0 && amount === 0;
}