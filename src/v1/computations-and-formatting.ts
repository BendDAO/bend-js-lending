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
import { ComputedUserNft, UserNftData } from '..';

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

export function getUsdBalance(
  balanceEth: BigNumberValue,
  usdPriceEth: BigNumberValue
): string {
  const balanceInEth = valueToZDBigNumber(balanceEth);
  const balanceInUsd = balanceInEth
    .multipliedBy(pow10(USD_DECIMALS))
    .dividedBy(usdPriceEth)
    .toFixed(0);
  return balanceInUsd;
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

export function computeUserNftData(
  poolNft: NftData,
  userNft: UserNftData,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number
): ComputedUserNft {
  currentTimestamp;

  const underlyingCollateralETH = valueToBigNumber(poolNft.price.priceInEth)
    .multipliedBy(userNft.totalCollateral)
    .toFixed(0);

  const underlyingCollateralUSD = getUsdBalance(
    underlyingCollateralETH,
    usdPriceEth
  );

  return {
    ...userNft,
    underlyingCollateralETH,
    underlyingCollateralUSD,
  };
}

export function computeRawUserSummaryData(
  poolReservesData: ReserveData[],
  rawUserReserves: UserReserveData[],
  poolNftsData: NftData[],
  rawUserNfts: UserNftData[],
  rawLoanDatas: LoanData[],
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

  // Reserves: Liquidity & Borrows
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
      totalBorrowsETH = totalBorrowsETH.plus(
        computedUserReserve.totalBorrowsETH
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

  // NFTs: Collaterals
  const userNftsData = rawUserNfts
    .map((userNft) => {
      const poolNft = poolNftsData.find(
        (nft) => nft.id === userNft.nftAsset.id
      );
      if (!poolNft) {
        throw new Error(
          'NFT is not registered on platform, please contact support'
        );
      }
      const computedUserNft = computeUserNftData(
        poolNft,
        userNft,
        usdPriceEth,
        currentTimestamp
      );

      totalCollateralETH = totalCollateralETH.plus(
        computedUserNft.underlyingCollateralETH
      );

      return computedUserNft;
    })
    .sort((a, b) =>
      a.nftAsset.symbol > b.nftAsset.symbol
        ? 1
        : a.nftAsset.symbol < b.nftAsset.symbol
        ? -1
        : 0
    );

  // Loans:
  const loansData = rawLoanDatas
    .map((loanData) => {
      const poolNft = poolNftsData.find(
        (nft) => nft.id === loanData.nftAsset.id
      );
      if (!poolNft) {
        throw new Error(
          'NFT is not registered on platform, please contact support'
        );
      }
      const poolReserve = poolReservesData.find(
        (reserve) => reserve.id === loanData.reserveAsset.id
      );
      if (!poolReserve) {
        throw new Error(
          'Reserve is not registered on platform, please contact support'
        );
      }

      const computedLoan = computeLoanData(
        poolReserve,
        poolNft,
        loanData,
        usdPriceEth,
        currentTimestamp
      );

      totalBorrowsETH = totalBorrowsETH.plus(computedLoan.currentAmount);

      return computedLoan;
    })
    .sort((a, b) =>
      a.nftAsset.symbol > b.nftAsset.symbol
        ? 1
        : a.nftAsset.symbol < b.nftAsset.symbol
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
    nftsData: userNftsData,
    loansData: loansData,
  };
}

export function formatUserSummaryData(
  poolReservesData: ReserveData[],
  rawUserReserves: UserReserveData[],
  poolNftsData: NftData[],
  rawUserNfts: UserNftData[],
  rawLoanDatas: LoanData[],
  userId: string,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number
): UserSummaryData {
  const userData = computeRawUserSummaryData(
    poolReservesData,
    rawUserReserves,
    poolNftsData,
    rawUserNfts,
    rawLoanDatas,
    userId,
    usdPriceEth,
    currentTimestamp
  );

  const userReservesData = userData.reservesData.map(
    ({ reserve, ...userReserve }): ComputedUserReserve => {
      return {
        ...userReserve,
        reserve: {
          ...reserve,
        },

        scaledBTokenBalance: normalize(
          userReserve.scaledBTokenBalance,
          reserve.decimals
        ),
        variableBorrowIndex: normalize(
          userReserve.variableBorrowIndex,
          RAY_DECIMALS
        ),

        underlyingBalance: normalize(
          userReserve.underlyingBalance,
          reserve.decimals
        ),
        underlyingBalanceETH: normalize(
          userReserve.underlyingBalanceETH,
          ETH_DECIMALS
        ),
        underlyingBalanceUSD: normalize(
          userReserve.underlyingBalanceUSD,
          USD_DECIMALS
        ),

        totalBorrows: normalize(userReserve.totalBorrows, reserve.decimals),
        totalBorrowsETH: normalize(userReserve.totalBorrowsETH, ETH_DECIMALS),
        totalBorrowsUSD: normalize(userReserve.totalBorrowsUSD, USD_DECIMALS),
      };
    }
  );

  const userNftsData = userData.nftsData.map(
    ({ nftAsset, ...userNft }): ComputedUserNft => {
      return {
        ...userNft,
        nftAsset: {
          ...nftAsset,
        },

        underlyingCollateralETH: normalize(
          userNft.underlyingCollateralETH,
          ETH_DECIMALS
        ),
        underlyingCollateralUSD: normalize(
          userNft.underlyingCollateralUSD,
          USD_DECIMALS
        ),
      };
    }
  );

  const loansData = userData.loansData.map(
    ({ nftAsset, ...loanData }): ComputedLoanData => {
      return {
        ...loanData,
        nftAsset: {
          ...nftAsset,
        },

        currentAmount: normalize(
          loanData.currentAmount,
          loanData.reserveAsset.decimals
        ),
        currentAmountETH: normalize(loanData.currentAmountETH, USD_DECIMALS),
        currentAmountUSD: normalize(loanData.currentAmountUSD, USD_DECIMALS),
        healthFactor: normalize(loanData.healthFactor, ETH_DECIMALS),
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
    nftsData: userNftsData,
    loansData: loansData,
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
  loanData: LoanData,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number
): ComputedLoanData {
  let currentAmount: string = '0';
  if (loanData.state == 'Active') {
    currentAmount = getCompoundedBalance(
      loanData.scaledAmount,
      poolReserve.variableBorrowIndex,
      poolReserve.variableBorrowRate,
      poolReserve.lastUpdateTimestamp,
      currentTimestamp
    ).toString();
  } else if (loanData.state == 'Auction') {
    currentAmount = loanData.bidBorrowAmount;
  } else {
    currentAmount = loanData.currentAmount;
  }

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
    ...loanData,
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
