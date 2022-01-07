import BigNumber from 'bignumber.js';

import {
  BigNumberValue,
  valueToBigNumber,
  valueToZDBigNumber,
  normalize,
  pow10,
  normalizeBN,
} from '../helpers/bignumber';
import {
  calculateHealthFactorFromBalances,
  getCompoundedBalance,
  calculateAverageRate,
  LTV_PRECISION,
  calculateCompoundedInterest,
  getLinearBalance,
} from '../helpers/pool-math';
import { RAY, rayMul, rayPow } from '../helpers/ray-math';
import {
  ComputedUserReserve,
  ReserveData,
  UserReserveData,
  UserSummaryData,
  ReserveRatesData,
  ComputedReserveData,
  Supplies,
  ReserveSupplyData,
  LoanData,
  ComputedLoanData,
  NftData,
} from './types';
import {
  ETH_DECIMALS,
  RAY_DECIMALS,
  SECONDS_PER_YEAR,
  USD_DECIMALS,
} from '../helpers/constants';

export function getEthAndUsdBalance(
  balance: BigNumberValue,
  priceInEth: BigNumberValue,
  decimals: number,
  usdPriceEth: BigNumberValue
): [string, string] {
  const balanceInEth = valueToZDBigNumber(balance)
    .multipliedBy(priceInEth)
    .dividedBy(pow10(decimals));
  const balanceInUsd = balanceInEth
    .multipliedBy(pow10(USD_DECIMALS))
    .dividedBy(usdPriceEth)
    .toFixed(0);
  return [balanceInEth.toString(), balanceInUsd];
}

export function computeUserReserveData(
  poolReserve: ReserveData,
  userReserve: UserReserveData,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number
): ComputedUserReserve {
  const {
    price: { priceInEth },
    decimals,
  } = poolReserve;
  const underlyingBalance = getLinearBalance(
    userReserve.scaledBTokenBalance,
    poolReserve.liquidityIndex,
    poolReserve.liquidityRate,
    poolReserve.lastUpdateTimestamp,
    currentTimestamp
  ).toString();
  const [underlyingBalanceETH, underlyingBalanceUSD] = getEthAndUsdBalance(
    underlyingBalance,
    priceInEth,
    decimals,
    usdPriceEth
  );

  const variableBorrows = getCompoundedBalance(
    userReserve.scaledVariableDebt,
    poolReserve.variableBorrowIndex,
    poolReserve.variableBorrowRate,
    poolReserve.lastUpdateTimestamp,
    currentTimestamp
  ).toString();

  const [variableBorrowsETH, variableBorrowsUSD] = getEthAndUsdBalance(
    variableBorrows,
    priceInEth,
    decimals,
    usdPriceEth
  );

  return {
    ...userReserve,
    underlyingBalance,
    underlyingBalanceETH,
    underlyingBalanceUSD,
    totalBorrows: valueToZDBigNumber(variableBorrows).toString(),
    totalBorrowsETH: valueToZDBigNumber(variableBorrowsETH).toString(),
    totalBorrowsUSD: valueToZDBigNumber(variableBorrowsUSD).toString(),
  };
}

export function computeRawUserSummaryData(
  poolReservesData: ReserveData[],
  rawUserReserves: UserReserveData[],
  userId: string,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number
): UserSummaryData {
  let totalLiquidityETH = valueToZDBigNumber('0');
  let totalCollateralETH = valueToZDBigNumber('0');
  let totalBorrowsETH = valueToZDBigNumber('0');

  let totalRewards = valueToBigNumber('0');
  let totalRewardsETH = valueToBigNumber('0');
  let totalRewardsUSD = valueToBigNumber('0');

  const userReservesData = rawUserReserves
    .map((userReserve) => {
      const poolReserve = poolReservesData.find(
        (reserve) => reserve.id === userReserve.reserve.id
      );
      if (!poolReserve) {
        throw new Error(
          'Reserve is not registered on platform, please contact support'
        );
      }
      const computedUserReserve = computeUserReserveData(
        poolReserve,
        userReserve,
        usdPriceEth,
        currentTimestamp
      );

      totalLiquidityETH = totalLiquidityETH.plus(
        computedUserReserve.underlyingBalanceETH
      );
      totalBorrowsETH = totalBorrowsETH
        .plus(computedUserReserve.totalBorrowsETH);

        totalCollateralETH = totalCollateralETH.plus(
          computedUserReserve.underlyingBalanceETH
        );

        return computedUserReserve;
    })
    .sort((a, b) =>
      a.reserve.symbol > b.reserve.symbol
        ? 1
        : a.reserve.symbol < b.reserve.symbol
        ? -1
        : 0
    );

  const totalCollateralUSD = totalCollateralETH
    .multipliedBy(pow10(USD_DECIMALS))
    .dividedBy(usdPriceEth)
    .toString();

  const totalLiquidityUSD = totalLiquidityETH
    .multipliedBy(pow10(USD_DECIMALS))
    .dividedBy(usdPriceEth)
    .toString();

  const totalBorrowsUSD = totalBorrowsETH
    .multipliedBy(pow10(USD_DECIMALS))
    .dividedBy(usdPriceEth)
    .toString();

  return {
    id: userId,

    totalLiquidityETH: totalLiquidityETH.toString(),
    totalLiquidityUSD,

    totalCollateralETH: totalCollateralETH.toString(),
    totalCollateralUSD,

    totalBorrowsETH: totalBorrowsETH.toString(),
    totalBorrowsUSD,

    totalRewards: totalRewards.toString(),
    totalRewardsETH: totalRewardsETH.toString(),
    totalRewardsUSD: totalRewardsUSD.toString(),

    reservesData: userReservesData,
    nftsData: [],
    loansData: [],
  };
}

export function formatUserSummaryData(
  poolReservesData: ReserveData[],
  rawUserReserves: UserReserveData[],
  userId: string,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number
): UserSummaryData {
  const userData = computeRawUserSummaryData(
    poolReservesData,
    rawUserReserves,
    userId,
    usdPriceEth,
    currentTimestamp
  );
  const userReservesData = userData.reservesData.map(
    ({ reserve, ...userReserve }): ComputedUserReserve => {
      const reserveDecimals = reserve.decimals;

      return {
        ...userReserve,
        reserve: {
          ...reserve,
          reserveLiquidationBonus: normalize(
            valueToBigNumber(reserve.reserveLiquidationBonus).minus(
              pow10(LTV_PRECISION)
            ),
            4
          ),
        },

        scaledBTokenBalance: normalize(
          userReserve.scaledBTokenBalance,
          reserveDecimals
        ),
        variableBorrowIndex: normalize(
          userReserve.variableBorrowIndex,
          RAY_DECIMALS
        ),

        underlyingBalance: normalize(
          userReserve.underlyingBalance,
          reserveDecimals
        ),
        underlyingBalanceETH: normalize(
          userReserve.underlyingBalanceETH,
          ETH_DECIMALS
        ),
        underlyingBalanceUSD: normalize(
          userReserve.underlyingBalanceUSD,
          USD_DECIMALS
        ),

        totalBorrows: normalize(userReserve.totalBorrows, reserveDecimals),
        totalBorrowsETH: normalize(userReserve.totalBorrowsETH, ETH_DECIMALS),
        totalBorrowsUSD: normalize(userReserve.totalBorrowsUSD, USD_DECIMALS),
      };
    }
  );

  return {
    id: userData.id,

    totalLiquidityETH: normalize(userData.totalLiquidityETH, ETH_DECIMALS),
    totalLiquidityUSD: normalize(userData.totalLiquidityUSD, USD_DECIMALS),

    totalCollateralETH: normalize(userData.totalCollateralETH, ETH_DECIMALS),
    totalCollateralUSD: normalize(userData.totalCollateralUSD, USD_DECIMALS),

    totalBorrowsETH: normalize(userData.totalBorrowsETH, ETH_DECIMALS),
    totalBorrowsUSD: normalize(userData.totalBorrowsUSD, USD_DECIMALS),

    totalRewards: normalize(userData.totalRewards, ETH_DECIMALS),
    totalRewardsETH: normalize(userData.totalRewardsETH, ETH_DECIMALS),
    totalRewardsUSD: normalize(userData.totalRewardsUSD, USD_DECIMALS),

    reservesData: userReservesData,
    nftsData: [],
    loansData: [],
  };
}

/**
 * Calculates the formatted debt accrued to a given point in time.
 * @param reserve
 * @param currentTimestamp unix timestamp which must be higher than reserve.lastUpdateTimestamp
 */
export function calculateReserveDebt(
  reserve: ReserveData,
  currentTimestamp: number
) {
  const totalVariableDebt = normalize(
    rayMul(
      rayMul(reserve.totalScaledVariableDebt, reserve.variableBorrowIndex),
      calculateCompoundedInterest(
        reserve.variableBorrowRate,
        currentTimestamp,
        reserve.lastUpdateTimestamp
      )
    ),
    reserve.decimals
  );
  return { totalVariableDebt };
}

export function formatReserves(
  reserves: ReserveData[],
  currentTimestamp?: number,
  reserveIndexes30DaysAgo?: ReserveRatesData[]
): ComputedReserveData[] {
  return reserves.map((reserve) => {
    const reserve30DaysAgo = reserveIndexes30DaysAgo?.find(
      (res) => res.id === reserve.id
    )?.paramsHistory?.[0];

    const availableLiquidity = normalize(
      reserve.availableLiquidity,
      reserve.decimals
    );

    const { totalVariableDebt } = calculateReserveDebt(
      reserve,
      currentTimestamp || reserve.lastUpdateTimestamp
    );

    const totalDebt = valueToBigNumber(totalVariableDebt);

    const totalLiquidity = totalDebt.plus(availableLiquidity).toString();
    const utilizationRate =
      totalLiquidity !== '0'
        ? totalDebt.dividedBy(totalLiquidity).toString()
        : '0';

    const supplyAPY = rayPow(
      valueToZDBigNumber(reserve.liquidityRate)
        .dividedBy(SECONDS_PER_YEAR)
        .plus(RAY),
      SECONDS_PER_YEAR
    ).minus(RAY);

    const variableBorrowAPY = rayPow(
      valueToZDBigNumber(reserve.variableBorrowRate)
        .dividedBy(SECONDS_PER_YEAR)
        .plus(RAY),
      SECONDS_PER_YEAR
    ).minus(RAY);

    return {
      ...reserve,
      totalVariableDebt,
      totalLiquidity,
      availableLiquidity,
      utilizationRate,
      totalDebt: totalDebt.toString(),
      price: {
        ...reserve.price,
        priceInEth: normalize(reserve.price.priceInEth, ETH_DECIMALS),
      },
      reserveFactor: normalize(reserve.reserveFactor, LTV_PRECISION),

      variableBorrowAPR: normalize(reserve.variableBorrowRate, RAY_DECIMALS),
      variableBorrowAPY: normalize(variableBorrowAPY, RAY_DECIMALS),

      avg30DaysVariableBorrowRate: reserve30DaysAgo
        ? calculateAverageRate(
            reserve30DaysAgo.variableBorrowIndex,
            reserve.variableBorrowIndex,
            reserve30DaysAgo.timestamp,
            reserve.lastUpdateTimestamp
          )
        : undefined,

      avg30DaysLiquidityRate: reserve30DaysAgo
        ? calculateAverageRate(
            reserve30DaysAgo.liquidityIndex,
            reserve.liquidityIndex,
            reserve30DaysAgo.timestamp,
            reserve.lastUpdateTimestamp
          )
        : undefined,

      supplyAPR: normalize(reserve.liquidityRate, RAY_DECIMALS),
      supplyAPY: normalize(supplyAPY, RAY_DECIMALS),

      liquidityIndex: normalize(reserve.liquidityIndex, RAY_DECIMALS),
      totalScaledVariableDebt: normalize(
        reserve.totalScaledVariableDebt,
        reserve.decimals
      ),
      variableBorrowIndex: normalize(reserve.variableBorrowIndex, RAY_DECIMALS),
    };
  });
}

/**
 * Calculates the debt accrued to a given point in time.
 * @param reserve
 * @param currentTimestamp unix timestamp which must be higher than reserve.lastUpdateTimestamp
 */
export function calculateReserveDebtSuppliesRaw(
  reserve: ReserveSupplyData,
  currentTimestamp: number
) {
  const totalVariableDebt = rayMul(
    rayMul(reserve.totalScaledVariableDebt, reserve.variableBorrowIndex),
    calculateCompoundedInterest(
      reserve.variableBorrowRate,
      currentTimestamp,
      reserve.lastUpdateTimestamp
    )
  );
  return { totalVariableDebt };
}

export function calculateSupplies(
  reserve: ReserveSupplyData,
  currentTimestamp: number
): Supplies {
  const { totalVariableDebt } = calculateReserveDebtSuppliesRaw(
    reserve,
    currentTimestamp
  );

  const totalDebt = totalVariableDebt;

  const totalLiquidity = totalDebt.plus(reserve.availableLiquidity);
  return {
    totalVariableDebt,
    totalLiquidity,
  };
}

export function computeLoanData(
  poolReserve: ReserveData,
  poolNft: NftData,
  poolLoan: LoanData,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number
): ComputedLoanData {
  const currentAmount = getCompoundedBalance(
    poolLoan.scaledAmount,
    poolReserve.variableBorrowIndex,
    poolReserve.variableBorrowRate,
    poolReserve.lastUpdateTimestamp,
    currentTimestamp
  ).toString();

  const [currentAmountETH, currentAmountUSD] = getEthAndUsdBalance(
    currentAmount,
    poolReserve.price.priceInEth,
    poolReserve.decimals,
    usdPriceEth
  );

  const totalCollateralETH = poolNft.price.priceInEth;

  const healthFactor = calculateHealthFactorFromBalances(
    totalCollateralETH,
    currentAmountETH,
    poolNft.liquidationThreshold
  ).toString();

  return {
    ...poolLoan,
    currentAmount,
    currentAmountETH,
    currentAmountUSD,
    healthFactor,
  };
}

export function calculateIncentivesAPY(
  emissionPerSecond: string,
  rewardTokenPriceInEth: string,
  tokenTotalSupplyNormalized: string,
  tokenPriceInEth: string
): string {
  const emissionPerSecondNormalized = normalizeBN(
    emissionPerSecond,
    ETH_DECIMALS
  ).multipliedBy(rewardTokenPriceInEth);
  const emissionPerYear =
    emissionPerSecondNormalized.multipliedBy(SECONDS_PER_YEAR);

  const totalSupplyNormalized = valueToBigNumber(
    tokenTotalSupplyNormalized
  ).multipliedBy(tokenPriceInEth);

  return emissionPerYear.dividedBy(totalSupplyNormalized).toString(10);
}

export function calculateRewards(
  principalUserBalance: string,
  reserveIndex: string,
  userIndex: string,
  precision: number,
  rewardTokenDecimals: number,
  reserveIndexTimestamp: number,
  emissionPerSecond: string,
  totalSupply: BigNumber,
  currentTimestamp: number,
  emissionEndTimestamp: number
): string {
  const actualCurrentTimestamp =
    currentTimestamp > emissionEndTimestamp
      ? emissionEndTimestamp
      : currentTimestamp;

  const timeDelta = actualCurrentTimestamp - reserveIndexTimestamp;

  let currentReserveIndex;
  if (
    reserveIndexTimestamp == +currentTimestamp ||
    reserveIndexTimestamp >= emissionEndTimestamp
  ) {
    currentReserveIndex = valueToZDBigNumber(reserveIndex);
  } else {
    currentReserveIndex = valueToZDBigNumber(emissionPerSecond)
      .multipliedBy(timeDelta)
      .multipliedBy(pow10(precision))
      .dividedBy(totalSupply)
      .plus(reserveIndex);
  }

  const reward = valueToZDBigNumber(principalUserBalance)
    .multipliedBy(currentReserveIndex.minus(userIndex))
    .dividedBy(pow10(precision));

  return normalize(reward, rewardTokenDecimals);
}
