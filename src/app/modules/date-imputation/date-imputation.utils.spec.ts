import {
  classifyPartialDate,
  fallsInRange,
  imputeConMedStartDate,
  lowerLimit,
  normalisePartialDate,
  upperLimit,
} from './date-imputation.utils';
import {
  ConMedStartDateImputationInput,
  PartialDate,
} from './date-imputation.types';

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// ─── normalisePartialDate ────────────────────────────────────────────

describe('normalisePartialDate', () => {
  it('returns null for null input', () => {
    expect(normalisePartialDate(null)).toBeNull();
  });

  it('passes through a complete date unchanged', () => {
    const pd: PartialDate = { year: 2021, month: 1, day: 21 };
    expect(normalisePartialDate(pd)).toEqual({ year: 2021, month: 1, day: 21 });
  });

  it('keeps day null when only day is missing', () => {
    const pd: PartialDate = { year: 2021, month: 1, day: null };
    expect(normalisePartialDate(pd)).toEqual({ year: 2021, month: 1, day: null });
  });

  it('forces day to null when month is missing', () => {
    const pd: PartialDate = { year: 2021, month: null, day: 15 };
    expect(normalisePartialDate(pd)).toEqual({ year: 2021, month: null, day: null });
  });

  it('handles both month and day missing', () => {
    const pd: PartialDate = { year: 2021, month: null, day: null };
    expect(normalisePartialDate(pd)).toEqual({ year: 2021, month: null, day: null });
  });
});

// ─── classifyPartialDate ─────────────────────────────────────────────

describe('classifyPartialDate', () => {
  it('classifies a complete date', () => {
    expect(classifyPartialDate({ year: 2021, month: 3, day: 15 })).toBe('complete');
  });

  it('classifies day missing', () => {
    expect(classifyPartialDate({ year: 2021, month: 3, day: null })).toBe('day_missing');
  });

  it('classifies day and month missing', () => {
    expect(classifyPartialDate({ year: 2021, month: null, day: null })).toBe('day_month_missing');
  });

  it('treats month-missing with a day value as day_month_missing', () => {
    expect(classifyPartialDate({ year: 2021, month: null, day: 5 })).toBe('day_month_missing');
  });
});

// ─── lowerLimit / upperLimit ─────────────────────────────────────────

describe('lowerLimit', () => {
  it('returns the same date for a complete date', () => {
    expect(lowerLimit({ year: 2021, month: 6, day: 15 })).toEqual(d(2021, 6, 15));
  });

  it('returns 1st of month when day is missing', () => {
    expect(lowerLimit({ year: 2021, month: 6, day: null })).toEqual(d(2021, 6, 1));
  });

  it('returns Jan 1 when month+day are missing', () => {
    expect(lowerLimit({ year: 2021, month: null, day: null })).toEqual(d(2021, 1, 1));
  });
});

describe('upperLimit', () => {
  it('returns the same date for a complete date', () => {
    expect(upperLimit({ year: 2021, month: 6, day: 15 })).toEqual(d(2021, 6, 15));
  });

  it('returns last day of month when day is missing', () => {
    expect(upperLimit({ year: 2021, month: 6, day: null })).toEqual(d(2021, 6, 30));
  });

  it('handles February in a non-leap year', () => {
    expect(upperLimit({ year: 2021, month: 2, day: null })).toEqual(d(2021, 2, 28));
  });

  it('handles February in a leap year', () => {
    expect(upperLimit({ year: 2024, month: 2, day: null })).toEqual(d(2024, 2, 29));
  });

  it('returns Dec 31 when month+day are missing', () => {
    expect(upperLimit({ year: 2021, month: null, day: null })).toEqual(d(2021, 12, 31));
  });
});

// ─── fallsInRange ────────────────────────────────────────────────────

describe('fallsInRange', () => {
  it('returns true for an exact complete date match', () => {
    expect(fallsInRange(d(2021, 3, 15), { year: 2021, month: 3, day: 15 })).toBeTrue();
  });

  it('returns true when candidate is within a day-missing range', () => {
    expect(fallsInRange(d(2021, 3, 10), { year: 2021, month: 3, day: null })).toBeTrue();
  });

  it('returns false when candidate is outside a day-missing range', () => {
    expect(fallsInRange(d(2021, 4, 1), { year: 2021, month: 3, day: null })).toBeFalse();
  });

  it('returns true when candidate is within a month+day-missing range', () => {
    expect(fallsInRange(d(2021, 7, 4), { year: 2021, month: null, day: null })).toBeTrue();
  });

  it('returns false for a different year', () => {
    expect(fallsInRange(d(2022, 1, 1), { year: 2021, month: null, day: null })).toBeFalse();
  });
});

// ─── imputeConMedStartDate ───────────────────────────────────────────

describe('imputeConMedStartDate', () => {
  const screening = d(2021, 1, 10);
  const treatmentStart = d(2021, 3, 1);

  // ── Complete date: no imputation needed ────────────────────────────

  it('returns the date as-is when the start date is complete', () => {
    const input: ConMedStartDateImputationInput = {
      screeningDate: screening,
      treatmentStartDate: treatmentStart,
      conMedStartDate: { year: 2021, month: 2, day: 15 },
      conMedEndDate: d(2021, 5, 1),
    };
    const result = imputeConMedStartDate(input);
    expect(result.imputedDate).toEqual(d(2021, 2, 15));
    expect(result.rule).toContain('No imputation needed');
  });

  // ── INCOMPLETE: day missing ────────────────────────────────────────

  describe('day missing', () => {
    it('imputes treatment start when end > treatment start and treatment start in range', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: { year: 2021, month: 3, day: null },
        conMedEndDate: d(2021, 5, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(treatmentStart);
      expect(result.rule).toContain('treatment start');
    });

    it('imputes lower limit when end > treatment start but treatment start NOT in range', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: { year: 2021, month: 2, day: null },
        conMedEndDate: d(2021, 5, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(d(2021, 2, 1));
      expect(result.rule).toContain('lower limit');
    });

    it('imputes lower limit when end date is before treatment start', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: { year: 2021, month: 1, day: null },
        conMedEndDate: d(2021, 2, 15),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(d(2021, 1, 1));
      expect(result.rule).toContain('lower limit');
    });

    it('imputes lower limit when end date is null', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: { year: 2021, month: 4, day: null },
        conMedEndDate: null,
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(d(2021, 4, 1));
      expect(result.rule).toContain('lower limit');
    });
  });

  // ── INCOMPLETE: day + month missing ────────────────────────────────

  describe('day and month missing', () => {
    it('imputes treatment start when end > treatment start and treatment start in range', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: { year: 2021, month: null, day: null },
        conMedEndDate: d(2021, 6, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(treatmentStart);
      expect(result.rule).toContain('treatment start');
    });

    it('imputes lower limit when treatment start is not in range (different year)', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: { year: 2020, month: null, day: null },
        conMedEndDate: d(2021, 6, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(d(2020, 1, 1));
      expect(result.rule).toContain('lower limit');
    });

    it('imputes lower limit when end date is before treatment start', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: { year: 2021, month: null, day: null },
        conMedEndDate: d(2021, 2, 20),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(d(2021, 1, 1));
      expect(result.rule).toContain('lower limit');
    });
  });

  // ── MISSING: start date is entirely null ───────────────────────────

  describe('start date entirely missing', () => {
    it('imputes treatment start when end date is after treatment start', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: null,
        conMedEndDate: d(2021, 5, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(treatmentStart);
      expect(result.rule).toContain('treatment start');
    });

    it('imputes treatment start when end date equals treatment start', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: null,
        conMedEndDate: d(2021, 3, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(treatmentStart);
      expect(result.rule).toContain('treatment start');
    });

    it('imputes earliest(screening, end-1) when end is before treatment start – screening wins', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: null,
        conMedEndDate: d(2021, 2, 20),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(screening);
      expect(result.rule).toContain('earliest');
    });

    it('imputes earliest(screening, end-1) when end is before treatment start – end-1 wins', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: d(2021, 2, 1),
        treatmentStartDate: treatmentStart,
        conMedStartDate: null,
        conMedEndDate: d(2021, 1, 20),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(d(2021, 1, 19));
      expect(result.rule).toContain('earliest');
    });

    it('imputes screening date when end date is also missing', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: null,
        conMedEndDate: null,
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(screening);
      expect(result.rule).toContain('screening visit date');
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles month missing with day present – treats day as missing too', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: screening,
        treatmentStartDate: treatmentStart,
        conMedStartDate: { year: 2021, month: null, day: 15 },
        conMedEndDate: d(2021, 6, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(treatmentStart);
    });

    it('handles leap-year Feb boundary for day-missing date', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: d(2024, 1, 5),
        treatmentStartDate: d(2024, 2, 29),
        conMedStartDate: { year: 2024, month: 2, day: null },
        conMedEndDate: d(2024, 4, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(d(2024, 2, 29));
      expect(result.rule).toContain('treatment start');
    });

    it('returns lower limit when treatment start is on Jan 1 but partial date is different year', () => {
      const input: ConMedStartDateImputationInput = {
        screeningDate: d(2019, 12, 1),
        treatmentStartDate: d(2020, 1, 1),
        conMedStartDate: { year: 2019, month: null, day: null },
        conMedEndDate: d(2020, 6, 1),
      };
      const result = imputeConMedStartDate(input);
      expect(result.imputedDate).toEqual(d(2019, 1, 1));
      expect(result.rule).toContain('lower limit');
    });
  });
});
