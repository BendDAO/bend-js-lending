import {
  ReserveData,
  UserReserveData,
  NftData,
  UserNftData,
  LoanData,
  UserIncentive,
} from '../v1/types';

export const mockUserId = '0x20000b9b01e93a39db9d286e9264eff7f2af16e9';

export const mockReserve: ReserveData = {
  availableLiquidity: '30176110452260548839',
  bTokenAddress: '0x1bbce5469b8bcc5078ae2398476350936d1393af',
  baseVariableBorrowRate: '0',
  borrowingEnabled: true,
  debtTokenAddress: '0xe42f3a56f89546a2596b88cff08234c5eea304b7',
  decimals: 18,
  id: '0xad1908f909b5c5d2b1032a215d611773f26f089f0xe55870ebb007a50b0dfabadb1a21e4bfcee5299b',
  isActive: true,
  isFrozen: false,
  liquidityIndex: '1035418342820124246541935825',
  liquidityRate: '549982846442182170767599658',
  name: 'Wrapped Ether',
  optimalUtilisationRate: '650000000000000000000000000',
  price: {
    priceInEth: '1000000000000000000',
  },
  reserveFactor: '1000',
  symbol: 'WETH',
  totalScaledVariableDebt: '191044198058136805282',
  underlyingAsset: '0xad1908f909b5c5d2b1032a215d611773f26f089f',
  variableBorrowIndex: '1041552912042164294219726251',
  variableBorrowRate: '703765368078737143668368534',
  variableRateSlope1: '80000000000000000000000000',
  variableRateSlope2: '1000000000000000000000000000',
  lastUpdateTimestamp: 1642159201,
};

export const mockUserReserve: UserReserveData = {
  scaledBTokenBalance: '1119602730417571034',
  scaledVariableDebt: '2012908826592418942',
  variableBorrowIndex: '1010075097877778651309419341',
  reserve: {
    id: '0xad1908f909b5c5d2b1032a215d611773f26f089f0xe55870ebb007a50b0dfabadb1a21e4bfcee5299b',
    underlyingAsset: '0xad1908f909b5c5d2b1032a215d611773f26f089f',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    lastUpdateTimestamp: 1642159201,
  },
};

export const mockNft: NftData = {
  underlyingAsset: '0x74e4418a41169fb951ca886976ccd8b36968c4ab',
  auctionDuration: '2',
  baseLTVasCollateral: '3000',
  bnftAddress: '0x8894215794f196018324d191a03ef987a617eb01',
  id: '0x74e4418a41169fb951ca886976ccd8b36968c4ab0xe55870ebb007a50b0dfabadb1a21e4bfcee5299b',
  isActive: true,
  isFrozen: false,
  lastUpdateTimestamp: 1642218270,
  liquidationBonus: '500',
  liquidationThreshold: '9000',
  name: 'Wrapped Cryptopunks',
  price: {
    priceInEth: '49600000000000000',
  },
  redeemDuration: '2',
  redeemFine: '100',
  symbol: 'WPUNKS',
  totalCollateral: '37',
};

export const mockUserNft: UserNftData = {
  totalCollateral: '3',
  nftAsset: {
    id: '0x74e4418a41169fb951ca886976ccd8b36968c4ab0xe55870ebb007a50b0dfabadb1a21e4bfcee5299b',
    underlyingAsset: '0x74e4418a41169fb951ca886976ccd8b36968c4ab',
    name: 'Wrapped Cryptopunks',
    symbol: 'WPUNKS',
    lastUpdateTimestamp: 1642218270,
  },
};

export const mockLoan: LoanData = {
  bidBorrowAmount: '0',
  bidPrice: '0',
  bidStartTimestamp: '0',
  bidderAddress: '0x00',
  borrower: '0x20000b9b01e93a39db9d286e9264eff7f2af16e9',
  currentAmount: '2032475549819576882',
  id: '50xe55870ebb007a50b0dfabadb1a21e4bfcee5299b',
  lastUpdateTimestamp: 1641216645,
  loanId: '5',
  nftAsset: {
    id: '0x74e4418a41169fb951ca886976ccd8b36968c4ab0xe55870ebb007a50b0dfabadb1a21e4bfcee5299b',
    lastUpdateTimestamp: 1642218270,
    name: 'Wrapped Cryptopunks',
    symbol: 'WPUNKS',
    underlyingAsset: '0x74e4418a41169fb951ca886976ccd8b36968c4ab',
  },
  nftTokenId: '1337',
  reserveAsset: {
    decimals: 18,
    id: '0xad1908f909b5c5d2b1032a215d611773f26f089f0xe55870ebb007a50b0dfabadb1a21e4bfcee5299b',
    lastUpdateTimestamp: 1642311951,
    name: 'Wrapped Ether',
    symbol: 'WETH',
    underlyingAsset: '0xad1908f909b5c5d2b1032a215d611773f26f089f',
  },
  scaledAmount: '2012908826592418942',
  state: 'Active',
};

export const mockUserIncentive: UserIncentive = {
  asset: {
    emissionPerSecond: 0,
    id: '0xd800e97ae32b06c1e89ca5126c7bf6aef89d6b240xd800e97ae32b06c1e89ca5126c7bf6aef89d6b24',
    index: 0,
  },
  //id: "0x20000b9b01e93a39db9d286e9264eff7f2af16e90xd800e97ae32b06c1e89ca5126c7bf6aef89d6b24",
  lastUpdateTimestamp: 1641228846,
  lifetimeRewards: '1545269812517967062645',
  reward: '1545269812517967062645',
};
