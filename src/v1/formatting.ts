import { BigNumberValue, normalize } from '../helpers/bignumber';
import { calculateAverageRate, PERCENT_PRECISION } from '../helpers/pool-math';
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
  USD_DECIMALS,
  BEND_DECIMALS,
} from '../helpers/constants';
import {
  ComputedNftData,
  ComputedUserNft,
  computeLoanData,
  computeNftData,
  computeRawUserSummaryData,
  computeReserveData,
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

        scaledAmount: normalize(
          loanData.scaledAmount,
          loanData.reserveAsset.decimals
        ),
        currentAmount: normalize(
          loanData.currentAmount,
          loanData.reserveAsset.decimals
        ),
        currentAmountETH: normalize(loanData.currentAmountETH, ETH_DECIMALS),
        currentAmountUSD: normalize(loanData.currentAmountUSD, USD_DECIMALS),

        availableToBorrow: normalize(
          loanData.availableToBorrow,
          loanData.reserveAsset.decimals
        ),
        availableToBorrowETH: normalize(
          loanData.availableToBorrowETH,
          ETH_DECIMALS
        ),
        availableToBorrowUSD: normalize(
          loanData.availableToBorrowUSD,
          USD_DECIMALS
        ),

        liquidatePrice: normalize(
          loanData.liquidatePrice,
          loanData.reserveAsset.decimals
        ),
        liquidatePriceETH: normalize(loanData.liquidatePriceETH, ETH_DECIMALS),
        liquidatePriceUSD: normalize(loanData.liquidatePriceUSD, USD_DECIMALS),

        bidBorrowAmount: normalize(
          loanData.bidBorrowAmount,
          loanData.reserveAsset.decimals
        ),
        bidPrice: normalize(loanData.bidPrice, loanData.reserveAsset.decimals),
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
    const computedReseveData = computeReserveData(reserve, currentTimestamp);

    const reserve30DaysAgo = reserveIndexes30DaysAgo?.find(
      (res) => res.id === reserve.id
    )?.paramsHistory?.[0];

    return {
      ...reserve,

      totalScaledVariableDebt: normalize(
        reserve.totalScaledVariableDebt,
        reserve.decimals
      ),
      totalVariableDebt: computedReseveData.totalVariableDebt,
      totalDebt: computedReseveData.totalDebt.toString(),
      availableLiquidity: computedReseveData.availableLiquidity,
      totalLiquidity: computedReseveData.totalLiquidity,
      utilizationRate: computedReseveData.utilizationRate,

      price: {
        ...reserve.price,
        priceInEth: normalize(reserve.price.priceInEth, ETH_DECIMALS),
      },
      reserveFactor: normalize(reserve.reserveFactor, PERCENT_PRECISION),

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

      liquidityIndex: normalize(reserve.liquidityIndex, RAY_DECIMALS),
      liquidityRate: normalize(reserve.liquidityRate, RAY_DECIMALS),
      liquidityAPY: normalize(computedReseveData.liquidityAPY, RAY_DECIMALS),

      variableBorrowIndex: normalize(reserve.variableBorrowIndex, RAY_DECIMALS),
      variableBorrowRate: normalize(reserve.variableBorrowRate, RAY_DECIMALS),
      variableBorrowAPY: normalize(
        computedReseveData.variableBorrowAPY,
        RAY_DECIMALS
      ),
    };
  });
}

export function formatNfts(
  nfts: NftData[],
  currentTimestamp?: number
): ComputedNftData[] {
  return nfts.map((nft) => {
    const computedNftData = computeNftData(nft, currentTimestamp);

    return {
      ...nft,

      availableToBorrowETH: normalize(
        computedNftData.availableToBorrowETH,
        ETH_DECIMALS
      ),

      price: {
        ...nft.price,
        priceInEth: normalize(nft.price.priceInEth, ETH_DECIMALS),
      },
      baseLTVasCollateral: normalize(
        nft.baseLTVasCollateral,
        PERCENT_PRECISION
      ),
      liquidationThreshold: normalize(
        nft.liquidationThreshold,
        PERCENT_PRECISION
      ),
      liquidationBonus: normalize(nft.liquidationBonus, PERCENT_PRECISION),
      redeemFine: normalize(nft.redeemFine, PERCENT_PRECISION),
    };
  });
}

export function formatLoans(
  poolReservesData: ReserveData[],
  poolNftsData: NftData[],
  loans: LoanData[],
  usdPriceEth: BigNumberValue,
  currentTimestamp?: number
): ComputedLoanData[] {
  return loans.map((loan) => {
    const poolNft = poolNftsData.find((nft) => nft.id === loan.nftAsset.id);
    if (!poolNft) {
      throw new Error(
        'NFT is not registered on platform, please contact support'
      );
    }
    const poolReserve = poolReservesData.find(
      (reserve) => reserve.id === loan.reserveAsset.id
    );
    if (!poolReserve) {
      throw new Error(
        'Reserve is not registered on platform, please contact support'
      );
    }

    const computedLoanData = computeLoanData(
      poolReserve,
      poolNft,
      loan,
      usdPriceEth,
      currentTimestamp || loan.lastUpdateTimestamp
    );

    return {
      ...loan,

      scaledAmount: normalize(
        computedLoanData.scaledAmount,
        poolReserve.decimals
      ),
      currentAmount: normalize(
        computedLoanData.currentAmount,
        poolReserve.decimals
      ),
      currentAmountETH: normalize(
        computedLoanData.currentAmountETH,
        ETH_DECIMALS
      ),
      currentAmountUSD: normalize(
        computedLoanData.currentAmountUSD,
        USD_DECIMALS
      ),
      availableToBorrow: normalize(
        computedLoanData.availableToBorrow,
        poolReserve.decimals
      ),
      availableToBorrowETH: normalize(
        computedLoanData.availableToBorrowETH,
        ETH_DECIMALS
      ),
      availableToBorrowUSD: normalize(
        computedLoanData.availableToBorrowUSD,
        USD_DECIMALS
      ),

      healthFactor: computedLoanData.healthFactor,

      liquidatePrice: normalize(
        computedLoanData.liquidatePrice,
        poolReserve.decimals
      ),
      liquidatePriceETH: normalize(
        computedLoanData.liquidatePriceETH,
        ETH_DECIMALS
      ),
      liquidatePriceUSD: normalize(
        computedLoanData.liquidatePriceUSD,
        USD_DECIMALS
      ),

      bidBorrowAmount: normalize(
        computedLoanData.bidBorrowAmount,
        poolReserve.decimals
      ),
      bidPrice: normalize(computedLoanData.bidPrice, poolReserve.decimals),
    };
  });
}
