import BigNumber from 'bignumber.js';

export type ReserveRatesData = {
  id: string;
  symbol: string;
  paramsHistory: {
    variableBorrowIndex: string;
    liquidityIndex: string;
    timestamp: number;
  }[];
};

export type ReserveSupplyData = {
  totalScaledVariableDebt: string;
  variableBorrowIndex: string;
  variableBorrowRate: string;
  availableLiquidity: string;
  lastUpdateTimestamp: number;
};

export type ReserveData = {
  id: string;
  underlyingAsset: string;
  name: string;
  symbol: string;
  decimals: number;
  isActive: boolean;
  isFrozen: boolean;
  borrowingEnabled: boolean;
  reserveFactor: string;
  bTokenAddress: string;
  debtTokenAddress: string;

  optimalUtilisationRate: string;
  baseVariableBorrowRate: string;
  variableRateSlope1: string;
  variableRateSlope2: string;

  liquidityIndex: string;
  variableBorrowIndex: string;
  variableBorrowRate: string;
  avg30DaysVariableBorrowRate?: string;
  availableLiquidity: string;
  liquidityRate: string;
  avg30DaysLiquidityRate?: string;
  totalScaledVariableDebt: string;
  lastUpdateTimestamp: number;
  price: {
    priceInEth: string;
  };
};

export type ComputedReserveData = {
  utilizationRate: string;
  totalDebt: string;
  totalLiquidity: string;
  supplyAPY: string;
  supplyAPR: string;
  variableBorrowAPY: string;
  variableBorrowAPR: string;
} & ReserveData;

export type Supplies = {
  totalVariableDebt: BigNumber;
  totalLiquidity: BigNumber;
};

export type UserReserveData = {
  scaledBTokenBalance: string;
  scaledVariableDebt: string;
  variableBorrowIndex: string;
  reserve: {
    id: string;
    underlyingAsset: string;
    name: string;
    symbol: string;
    decimals: number;
    lastUpdateTimestamp: number;
  };
};

export type ComputedUserReserve = UserReserveData & {
  underlyingBalance: string;
  underlyingBalanceETH: string;
  underlyingBalanceUSD: string;

  totalBorrows: string;
  totalBorrowsETH: string;
  totalBorrowsUSD: string;
};

export type NftData = {
  id: string;
  underlyingAsset: string;
  name: string;
  symbol: string;
  isActive: boolean;
  isFrozen: boolean;
  baseLTVasCollateral: string;
  liquidationThreshold: string;
  liquidationBonus: string;
  redeemDuration: string;
  auctionDuration: string;
  redeemFine: string;
  bnftAddress: string;

  totalCollateral: string;
  price: {
    priceInEth: string;
  };
};

export type UserNftData = {
  totalCollateral: string;
  nftAsset: {
    id: string;
    underlyingAsset: string;
    name: string;
    symbol: string;
    lastUpdateTimestamp: number;
  };
};

export type ComputedUserNft = UserNftData & {
  underlyingCollateralETH: string;
  underlyingCollateralUSD: string;
};

export type LoanData = {
  id: string;
  loanId: string;
  borrower: string;
  nftAsset: {
    id: string;
    underlyingAsset: string;
    name: string;
    symbol: string;
    lastUpdateTimestamp: number;
  };
  nftTokenId: string;
  reserveAsset: {
    id: string;
    underlyingAsset: string;
    name: string;
    symbol: string;
    decimals: number;
    lastUpdateTimestamp: number;
  };
  scaledAmount: string;
  currentAmount: string;
  state: string;
  bidStartTimestamp: string;
  bidPrice: string;
  bidBorrowAmount: string;
};

export type ComputedLoanData = LoanData & {
  currentAmount: string;
  currentAmountETH: string;
  currentAmountUSD: string;
  healthFactor: string;
};

export type UserSummaryData = {
  id: string;

  totalLiquidityETH: string;
  totalLiquidityUSD: string;

  totalCollateralETH: string;
  totalCollateralUSD: string;

  totalBorrowsETH: string;
  totalBorrowsUSD: string;

  // BEND Token Incentive
  totalRewards: string;
  totalRewardsETH: string;
  totalRewardsUSD: string;

  reservesData: ComputedUserReserve[];
  nftsData: ComputedUserNft[];
  loansData: ComputedLoanData[];
};
