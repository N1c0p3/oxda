export type ProductCostingInput = {
  zone: string;
  delivery: string;
  conditions: string;
  currency: string;
  boxesPerPallet: number;
  palletsPerContainer: number;
  originPriceKg: number;
  seaFreight: number;
  exchangeRateBase: number;
  exchangeRateFactor: number;
  interestTaxRate: number;
  customsExpenses: number;
  inlandFreight: number;
  storagePerBox: number;
  targetMargin: number;
};

export type ProductCostingResult = {
  boxesPerContainer: number;
  kgPerContainer: number;
  effectiveExchangeRate: number;
  originCostPerBox: number;
  seaFreightPerBox: number;
  originTotalPerBox: number;
  convertedOriginCostPerBox: number;
  interestTaxPerBox: number;
  customsPerBox: number;
  inlandFreightPerBox: number;
  storagePerBox: number;
  landedCostPerBox: number;
  salePricePerBox: number;
  salePricePerKg: number;
  recoveryFactor: number;
};

export const EMPTY_PRODUCT_COSTING: ProductCostingInput = {
  zone: "",
  delivery: "",
  conditions: "",
  currency: "EUR/USD",
  boxesPerPallet: 108,
  palletsPerContainer: 22,
  originPriceKg: 0,
  seaFreight: 0,
  exchangeRateBase: 20.4,
  exchangeRateFactor: 1.025,
  interestTaxRate: 0.027,
  customsExpenses: 0,
  inlandFreight: 0,
  storagePerBox: 0,
  targetMargin: 0.13,
};

function finite(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function calculateProductCosting(kgBox: number, input: ProductCostingInput): ProductCostingResult {
  const boxesPerContainer = finite(input.boxesPerPallet * input.palletsPerContainer);
  const kgPerContainer = finite(kgBox * boxesPerContainer);
  const effectiveExchangeRate = finite(input.exchangeRateBase * input.exchangeRateFactor);
  const originCostPerBox = finite(kgBox * input.originPriceKg);
  const seaFreightPerBox = boxesPerContainer > 0 ? finite(input.seaFreight / boxesPerContainer) : 0;
  const originTotalPerBox = finite(originCostPerBox + seaFreightPerBox);
  const convertedOriginCostPerBox = finite(originTotalPerBox * effectiveExchangeRate);
  const interestTaxPerBox = finite(convertedOriginCostPerBox * input.interestTaxRate);
  const customsPerBox = boxesPerContainer > 0 ? finite(input.customsExpenses / boxesPerContainer) : 0;
  const inlandFreightPerBox = boxesPerContainer > 0 ? finite(input.inlandFreight / boxesPerContainer) : 0;
  const storagePerBox = finite(input.storagePerBox);
  const landedCostPerBox = finite(
    convertedOriginCostPerBox + interestTaxPerBox + customsPerBox + inlandFreightPerBox + storagePerBox,
  );
  const recoveryFactor = finite(1 - input.targetMargin);
  const salePricePerBox = recoveryFactor > 0 ? finite(landedCostPerBox / recoveryFactor) : 0;
  const salePricePerKg = kgBox > 0 ? finite(salePricePerBox / kgBox) : 0;

  return {
    boxesPerContainer,
    kgPerContainer,
    effectiveExchangeRate,
    originCostPerBox,
    seaFreightPerBox,
    originTotalPerBox,
    convertedOriginCostPerBox,
    interestTaxPerBox,
    customsPerBox,
    inlandFreightPerBox,
    storagePerBox,
    landedCostPerBox,
    salePricePerBox,
    salePricePerKg,
    recoveryFactor,
  };
}
