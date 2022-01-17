import {
  BigNumberValue,
  valueToBigNumber,
  valueToZDBigNumber,
  normalize,
} from '../helpers/bignumber';
import { calculateAverageRate, LTV_PRECISION } from '../helpers/pool-math';
import { RAY, rayPow } from '../helpers/ray-math';
import {
  ComputedUserReserve,
  ReserveData,
  UserReserveData,
  UserSummaryData,
  ReserveRatesData,
  ComputedReserveData,
  LoanData,
  ComputedLoanData,
  NftData,
} from './types';
import {
  ETH_DECIMALS,
  RAY_DECIMALS,
  SECONDS_PER_YEAR,
  USD_DECIMALS,
  BEND_DECIMALS,
} from '../helpers/constants';
import {
  calculateReserveDebt,
  ComputedUserNft,
  computeRawUserSummaryData,
  UserIncentive,
  UserNftData,
} from '..';
import './computations';

export function formatUserSummaryData(
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
  const userData = computeRawUserSummaryData(
    poolReservesData,
    rawUserReserves,
    poolNftsData,
    rawUserNfts,
    rawLoanDatas,
    rawUserIncentives,
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

        scaledVariableDebt: normalize(
          userReserve.scaledVariableDebt,
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
        currentAmountETH: normalize(loanData.currentAmountETH, ETH_DECIMALS),
        currentAmountUSD: normalize(loanData.currentAmountUSD, USD_DECIMALS),
      };
    }
  );

  const incentivesData = userData.incentivesData.map(
    ({ asset, ...incentiveData }): UserIncentive => {
      return {
        ...incentiveData,
        asset: {
          ...asset,
        },

        lifetimeRewards: normalize(
          incentiveData.lifetimeRewards,
          BEND_DECIMALS
        ),
        reward: normalize(incentiveData.reward, BEND_DECIMALS),
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

    totalRewards: normalize(userData.totalRewards, BEND_DECIMALS),

    reservesData: userReservesData,
    nftsData: userNftsData,
    loansData: loansData,
    incentivesData: incentivesData,
  };
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
      liquidityRate: normalize(reserve.liquidityRate, RAY_DECIMALS),

      totalScaledVariableDebt: normalize(
        reserve.totalScaledVariableDebt,
        reserve.decimals
      ),
      variableBorrowIndex: normalize(reserve.variableBorrowIndex, RAY_DECIMALS),
      variableBorrowRate: normalize(reserve.variableBorrowRate, RAY_DECIMALS),
    };
  });
}
