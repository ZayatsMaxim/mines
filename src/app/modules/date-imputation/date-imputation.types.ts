/**
 * Represents a partial (possibly incomplete) date as used in clinical trial data.
 *
 * Encoding conventions:
 *   - Full date:           { year: 2021, month: 1, day: 21 }
 *   - Day missing:         { year: 2021, month: 1, day: null }
 *   - Day+month missing:   { year: 2021, month: null, day: null }
 *   - Entirely missing:    null
 *
 * If month is null, day is always treated as null regardless of its stored value.
 */
export interface PartialDate {
  year: number;
  month: number | null;
  day: number | null;
}

/**
 * All inputs required to impute a concomitant-medication start date.
 *
 * DS – date of screening visit (always a complete date).
 * treatmentStartDate – first date of study treatment (complete date).
 * conMedStartDate – the (possibly incomplete) concomitant-medication start date to impute.
 * conMedEndDate – the concomitant-medication end date (complete date, may be null if ongoing).
 */
export interface ConMedStartDateImputationInput {
  screeningDate: Date;
  treatmentStartDate: Date;
  conMedStartDate: PartialDate | null;
  conMedEndDate: Date | null;
}

export interface ImputationResult {
  imputedDate: Date;
  rule: string;
}
