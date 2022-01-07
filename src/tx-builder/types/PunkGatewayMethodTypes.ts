import { tEthereumAddress, tStringCurrencyUnits } from '.';

export type PunkERC20BorrowParamsType = {
  user: tEthereumAddress;
  reserve: tEthereumAddress;
  amount: tStringCurrencyUnits;
  wpunkAddress: tEthereumAddress;
  punkIndex: string;
  onBehalfOf?: tEthereumAddress;
  referralCode?: string;
};

export type PunkERC20RepayParamsType = {
  user: tEthereumAddress;
  punkIndex: string;
  reserve: tEthereumAddress;
  amount: tStringCurrencyUnits;
};

export type PunkERC20AuctionParamsType = {
  user: tEthereumAddress;
  punkIndex: string;
  reserve: tEthereumAddress;
  bidPrice: tStringCurrencyUnits;
  onBehalfOf?: tEthereumAddress;
};

export type PunkERC20RedeemParamsType = {
  user: tEthereumAddress;
  punkIndex: string;
  reserve: tEthereumAddress;
  amount: tStringCurrencyUnits;
};

export type PunkERC20LiquidateParamsType = {
  user: tEthereumAddress;
  punkIndex: string;
};

export type PunkETHBorrowParamsType = {
  user: tEthereumAddress;
  amount: tStringCurrencyUnits;
  wpunkAddress: tEthereumAddress;
  punkIndex: string;
  onBehalfOf?: tEthereumAddress;
  referralCode?: string;
};

export type PunkETHRepayParamsType = {
  user: tEthereumAddress;
  punkIndex: string;
  amount: tStringCurrencyUnits;
};

export type PunkETHAuctionParamsType = {
  user: tEthereumAddress;
  punkIndex: string;
  bidPrice: tStringCurrencyUnits;
  onBehalfOf?: tEthereumAddress;
};

export type PunkETHRedeemParamsType = {
  user: tEthereumAddress;
  punkIndex: string;
  amount: tStringCurrencyUnits;
};

export type PunkETHLiquidateParamsType = {
  user: tEthereumAddress;
  punkIndex: string;
};
