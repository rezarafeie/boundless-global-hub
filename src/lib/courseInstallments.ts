export interface CourseInstallmentSettings {
  snapppay_enabled?: boolean;
  digipay_enabled?: boolean;
}

export interface GatewayInstallmentSettings {
  snapppay_enabled?: boolean;
  rafieipay_snapppay_enabled?: boolean;
  digipay_enabled?: boolean;
  snapppay_max_amount_toman?: number | null;
  digipay_max_amount_toman?: number | null;
}

export interface CourseInstallmentPlan {
  gateway: 'snapppay' | 'digipay';
  count: 4 | 6;
  amount: number;
  firstPayment: number;
}

/**
 * The same course switches and amount limits used by checkout decide whether
 * campaign pricing may advertise installments. SnappPay is preferred when
 * both gateways are available; DigiPay remains the six-installment fallback.
 */
export const courseInstallmentPlan = (
  course: CourseInstallmentSettings,
  gateways: GatewayInstallmentSettings,
  amount: number,
): CourseInstallmentPlan | null => {
  const roundedAmount = Math.round(amount);
  if (!Number.isFinite(roundedAmount) || roundedAmount <= 0) return null;

  const snapppayMax = Number(gateways.snapppay_max_amount_toman || 50_000_000);
  const snapppayGloballyEnabled = gateways.snapppay_enabled === true || gateways.rafieipay_snapppay_enabled === true;
  if (
    snapppayGloballyEnabled &&
    course.snapppay_enabled !== false &&
    roundedAmount <= snapppayMax
  ) {
    return {
      gateway: 'snapppay',
      count: 4,
      amount: roundedAmount,
      firstPayment: Math.round(roundedAmount / 4),
    };
  }

  const digipayMax = Number(gateways.digipay_max_amount_toman || 100_000_000);
  if (
    gateways.digipay_enabled === true &&
    course.digipay_enabled !== false &&
    roundedAmount <= digipayMax
  ) {
    return {
      gateway: 'digipay',
      count: 6,
      amount: roundedAmount,
      firstPayment: Math.round(roundedAmount / 6),
    };
  }

  return null;
};
