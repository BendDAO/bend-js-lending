import { tEthereumAddress, tStringCurrencyUnits } from '.';

export type LPDepositParamsType = {
  user: tEthereumAddress;
  reserve: tEthereumAddress;
  amount: tStringCurrencyUnits;
  onBehalfOf?: tEthereumAddress;
  referralCode?: string;
};

export type LPWithdrawParamsType = {
  user: tEthereumAddress;
  reserve: tEthereumAddress;
  amount: tStringCurrencyUnits;
  onBehalfOf?: tEthereumAddress;
};

export type LPBorrowParamsType = {
  user: tEthereumAddress;
  reserve: tEthereumAddress;
  amount: tStringCurrencyUnits;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
  onBehalfOf?: tEthereumAddress;
  referralCode?: string;
};

export type LPRepayParamsType = {
  user: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
  reserve: tEthereumAddress;
  amount: tStringCurrencyUnits;
  onBehalfOf?: tEthereumAddress;
};

export type LPAuctionParamsType = {
  user: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
  reserve: tEthereumAddress;
  bidPrice: tStringCurrencyUnits;
  onBehalfOf?: tEthereumAddress;
};

export type LPRedeemParamsType = {
  user: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
  reserve: tEthereumAddress;
  amount: tStringCurrencyUnits;
};

export type LPLiquidateParamsType = {
  user: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
};
