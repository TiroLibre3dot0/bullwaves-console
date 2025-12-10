import { computeCohortBreakEvenFromRows } from '../../cohort/utils/computeCohortBreakEven'

// Accepts monthly rows shaped like the cohort table (monthLabel, monthIndex, pl, commissions/payments).
export const computeCohortBreakEvenForAffiliate = (monthlyRows = []) => computeCohortBreakEvenFromRows(monthlyRows)

export default computeCohortBreakEvenForAffiliate
