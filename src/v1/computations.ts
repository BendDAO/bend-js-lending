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
  calculateAvailableBorrowsETH,
  calculateHealthFactorFromBalances,
  getCompoundedBalance,
  calculateCompoundedInterest,
  getLinearBalance,
} from '../helpers/pool-math';
import { RAY, rayPow, rayMul } from '../helpers/ray-math';
import {
  ComputedUserReserve,
  ReserveData,
  UserReserveData,
  UserSummaryData,
  Supplies,
  ReserveSupplyData,
  LoanData,
  ComputedLoanData,
  NftData,
} from './types';
import { ETH_DECIMALS, SECONDS_PER_YEAR } from '../helpers/constants';
import {
  ComputedNftData,
  ComputedReserveData,
  ComputedUserNft,
  UserIncentive,
  UserNftData,
} from '..';

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
    .multipliedBy(usdPriceEth)
    .dividedBy(pow10(ETH_DECIMALS))
    .toFixed(0);
  return [balanceInEth.toString(), balanceInUsd];
}

export function getUsdBalance(
  balanceEth: BigNumberValue,
  usdPriceEth: BigNumberValue
): string {
  const balanceInEth = valueToZDBigNumber(balanceEth);
  const balanceInUsd = balanceInEth
    .multipliedBy(usdPriceEth)
    .dividedBy(pow10(ETH_DECIMALS))
    .toFixed(0);
  return balanceInUsd;
}

export function getReserveBalance(
  balanceEth: BigNumberValue,
  reservePriceEth: BigNumberValue,
  decimals: number
): string {
  const balanceInEth = valueToZDBigNumber(balanceEth);
  const balanceInReserve = balanceInEth
    .multipliedBy(pow10(decimals))
    .dividedBy(reservePriceEth)
    .toFixed(0);
  return balanceInReserve;
}

export function computeReserveData(
  poolReserve: ReserveData,
  currentTimestamp?: number
): ComputedReserveData {
  const availableLiquidity = normalize(
    poolReserve.availableLiquidity,
    poolReserve.decimals
  );

  const { totalVariableDebt } = calculateReserveDebt(
    poolReserve,
    currentTimestamp || poolReserve.lastUpdateTimestamp
  );
  const totalDebt = valueToBigNumber(totalVariableDebt);

  const totalLiquidity = totalDebt.plus(availableLiquidity).toString();

  const utilizationRate =
    totalLiquidity !== '0'
      ? totalDebt.dividedBy(totalLiquidity).toString()
      : '0';

  const liquidityAPY = rayPow(
    valueToZDBigNumber(poolReserve.liquidityRate)
      .dividedBy(SECONDS_PER_YEAR)
      .plus(RAY),
    SECONDS_PER_YEAR
  ).minus(RAY);

  const variableBorrowAPY = rayPow(
    valueToZDBigNumber(poolReserve.variableBorrowRate)
      .dividedBy(SECONDS_PER_YEAR)
      .plus(RAY),
    SECONDS_PER_YEAR
  ).minus(RAY);

  return {
    totalVariableDebt,
    totalDebt: totalDebt.toString(),
    totalLiquidity,
    utilizationRate: utilizationRate.toString(),

    liquidityAPY: liquidityAPY.toString(),
    variableBorrowAPY: variableBorrowAPY.toString(),

    ...poolReserve,
  };
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

export function computeNftData(
  poolNft: NftData,
  currentTimestamp?: number
): ComputedNftData {
  currentTimestamp;

  const availableToBorrowETH = calculateAvailableBorrowsETH(
    poolNft.price.priceInEth,
    0,
    poolNft.baseLTVasCollateral
  );

  return {
    availableToBorrowETH: availableToBorrowETH.toString(),

    ...poolNft,
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
  rawUserIncentives: UserIncentive[],
  userId: string,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number
): UserSummaryData {
  let totalLiquidityETH = valueToZDBigNumber('0');
  let totalCollateralETH = valueToZDBigNumber('0');
  let totalBorrowsETH = valueToZDBigNumber('0');

  let totalRewards = valueToBigNumber('0');

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

  // Incentives:
  const userIncentives = rawUserIncentives
    .map((userIncentive) => {
      totalRewards = totalRewards.plus(userIncentive.reward);
      return userIncentive;
    })
    .sort((a, b) =>
      a.asset.index > b.asset.index ? 1 : a.asset.index < b.asset.index ? -1 : 0
    );

  const totalCollateralUSD = getUsdBalance(totalCollateralETH, usdPriceEth);

  const totalLiquidityUSD = getUsdBalance(totalLiquidityETH, usdPriceEth);

  const totalBorrowsUSD = getUsdBalance(totalBorrowsETH, usdPriceEth);

  return {
    id: userId,

    totalLiquidityETH: totalLiquidityETH.toString(),
    totalLiquidityUSD,

    totalCollateralETH: totalCollateralETH.toString(),
    totalCollateralUSD,

    totalBorrowsETH: totalBorrowsETH.toString(),
    totalBorrowsUSD,

    totalRewards: totalRewards.toString(),

    reservesData: userReservesData,
    nftsData: userNftsData,
    loansData: loansData,
    incentivesData: userIncentives,
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
  currentTimestamp?: number
): ComputedLoanData {
  currentTimestamp = currentTimestamp || loanData.lastUpdateTimestamp;

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
  const totalCollateral = getReserveBalance(
    totalCollateralETH,
    poolReserve.price.priceInEth,
    poolReserve.decimals
  );

  const availableToBorrow = calculateAvailableBorrowsETH(
    totalCollateral,
    currentAmount,
    poolNft.baseLTVasCollateral
  );
  const [availableToBorrowETH, availableToBorrowUSD] = getEthAndUsdBalance(
    availableToBorrow,
    poolReserve.price.priceInEth,
    poolReserve.decimals,
    usdPriceEth
  );

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

    availableToBorrow: availableToBorrow.toString(),
    availableToBorrowETH,
    availableToBorrowUSD,

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
