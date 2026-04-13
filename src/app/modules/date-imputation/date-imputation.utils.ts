import {
  ConMedStartDateImputationInput,
  ImputationResult,
  PartialDate,
} from './date-imputation.types';

// ---------------------------------------------------------------------------
// Helper: calendar utilities
// ---------------------------------------------------------------------------

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function makeDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function earliest(...dates: Date[]): Date {
  return dates.reduce((a, b) => (a <= b ? a : b));
}

// ---------------------------------------------------------------------------
// Partial-date helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a PartialDate so that if month is missing the day is also
 * treated as missing (per specification).
 */
export function normalisePartialDate(
  pd: PartialDate | null,
): PartialDate | null {
  if (pd === null) return null;
  const month = pd.month;
  const day = month === null ? null : pd.day;
  return { year: pd.year, month, day };
}

export type DateCompleteness = 'complete' | 'day_missing' | 'day_month_missing';

export function classifyPartialDate(pd: PartialDate): DateCompleteness {
  const norm = normalisePartialDate(pd)!;
  if (norm.month !== null && norm.day !== null) return 'complete';
  if (norm.month !== null && norm.day === null) return 'day_missing';
  return 'day_month_missing';
}

/**
 * Lower limit (DL) of the range of possible dates for a partial date.
 */
export function lowerLimit(pd: PartialDate): Date {
  const norm = normalisePartialDate(pd)!;
  const cls = classifyPartialDate(norm);
  switch (cls) {
    case 'complete':
      return makeDate(norm.year, norm.month!, norm.day!);
    case 'day_missing':
      return makeDate(norm.year, norm.month!, 1);
    case 'day_month_missing':
      return makeDate(norm.year, 1, 1);
  }
}

/**
 * Upper limit (DU) of the range of possible dates for a partial date.
 */
export function upperLimit(pd: PartialDate): Date {
  const norm = normalisePartialDate(pd)!;
  const cls = classifyPartialDate(norm);
  switch (cls) {
    case 'complete':
      return makeDate(norm.year, norm.month!, norm.day!);
    case 'day_missing':
      return makeDate(
        norm.year,
        norm.month!,
        lastDayOfMonth(norm.year, norm.month!),
      );
    case 'day_month_missing':
      return makeDate(norm.year, 12, 31);
  }
}

/**
 * Return true when `candidate` falls within the [DL, DU] range of the
 * partial date (inclusive).
 */
export function fallsInRange(candidate: Date, pd: PartialDate): boolean {
  const c = stripTime(candidate);
  return c >= lowerLimit(pd) && c <= upperLimit(pd);
}

// ---------------------------------------------------------------------------
// Core imputation logic for Concomitant Medication start date
// ---------------------------------------------------------------------------

/**
 * Determines whether the concomitant medication end date is "after" the
 * treatment start date (i.e. end date > treatment start date, meaning
 * the medication was ongoing during the treatment period).
 */
function conMedEndIsAfterTreatmentStart(
  conMedEndDate: Date | null,
  treatmentStartDate: Date,
): boolean {
  if (conMedEndDate === null) return false;
  return stripTime(conMedEndDate) >= stripTime(treatmentStartDate);
}

/**
 * Impute a concomitant-medication start date (DR) according to the
 * specification for handling incomplete or missing dates.
 *
 * ## Rules
 *
 * ### Date/time is INCOMPLETE (day missing, or day+month missing)
 *
 * 1. If the concomitant medication end date is after (>=) the treatment
 *    start date **and** the treatment start date falls within the range
 *    [DL, DU] of possible dates for the incomplete start date → imputed
 *    date = treatment start date.
 *
 * 2. Otherwise → imputed date = lower limit (DL).
 *
 * ### Date/time is MISSING (entirely null)
 *
 * 1. If the concomitant medication end date is after (>=) the treatment
 *    start date → imputed date = treatment start date.
 *
 * 2. Otherwise → imputed date = the earliest of:
 *      • the screening visit date (DS), and
 *      • the concomitant medication end date minus 1 day.
 *    (If end date is also null, the screening date is used.)
 */
export function imputeConMedStartDate(
  input: ConMedStartDateImputationInput,
): ImputationResult {
  const {
    screeningDate,
    treatmentStartDate,
    conMedStartDate,
    conMedEndDate,
  } = input;

  const ds = stripTime(screeningDate);
  const treatStart = stripTime(treatmentStartDate);
  const endDate = conMedEndDate ? stripTime(conMedEndDate) : null;

  // ── CASE 1: Start date is fully present (complete) ──────────────────
  const normalised = normalisePartialDate(conMedStartDate);
  if (normalised !== null && classifyPartialDate(normalised) === 'complete') {
    return {
      imputedDate: makeDate(
        normalised.year,
        normalised.month!,
        normalised.day!,
      ),
      rule: 'No imputation needed – date is complete.',
    };
  }

  // ── CASE 2: Start date is INCOMPLETE (partial) ─────────────────────
  if (normalised !== null) {
    const endAfterTreat = conMedEndIsAfterTreatmentStart(
      endDate,
      treatStart,
    );

    if (endAfterTreat && fallsInRange(treatStart, normalised)) {
      return {
        imputedDate: treatStart,
        rule:
          'Incomplete date – con-med end date is after treatment start and ' +
          'treatment start falls in the range of possible dates → ' +
          'imputed as treatment start date.',
      };
    }

    return {
      imputedDate: lowerLimit(normalised),
      rule:
        'Incomplete date – treatment start does not qualify → ' +
        'imputed as lower limit (DL) of the partial date range.',
    };
  }

  // ── CASE 3: Start date is entirely MISSING ─────────────────────────
  const endAfterTreat = conMedEndIsAfterTreatmentStart(endDate, treatStart);

  if (endAfterTreat) {
    return {
      imputedDate: treatStart,
      rule:
        'Missing date – con-med end date is after treatment start → ' +
        'imputed as treatment start date.',
    };
  }

  if (endDate !== null) {
    const endMinus1 = addDays(endDate, -1);
    return {
      imputedDate: earliest(ds, endMinus1),
      rule:
        'Missing date – con-med end date is not after treatment start → ' +
        'imputed as the earliest of screening date and (end date − 1 day).',
    };
  }

  return {
    imputedDate: ds,
    rule:
      'Missing date – no con-med end date available → ' +
      'imputed as the screening visit date.',
  };
}
