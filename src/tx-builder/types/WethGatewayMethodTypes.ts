import { tEthereumAddress, tStringCurrencyUnits } from '.';

export type WETHDepositParamsType = {
  user: tEthereumAddress;
  amount: tStringCurrencyUnits;
  onBehalfOf?: tEthereumAddress;
  referralCode?: string;
};

export type WETHWithdrawParamsType = {
  user: tEthereumAddress;
  amount: tStringCurrencyUnits;
  bTokenAddress: tEthereumAddress;
  onBehalfOf?: tEthereumAddress;
};

export type WETHBorrowParamsType = {
  user: tEthereumAddress;
  amount: tStringCurrencyUnits;
  bTokenAddress: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
  onBehalfOf?: tEthereumAddress;
  referralCode?: string;
};

export type WETHRepayParamsType = {
  user: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
  amount: tStringCurrencyUnits;
};

export type WETHAuctionParamsType = {
  user: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
  bidPrice: tStringCurrencyUnits;
  onBehalfOf?: tEthereumAddress;
};

export type WETHRedeemParamsType = {
  user: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
  amount: tStringCurrencyUnits;
};

export type WETHLiquidateParamsType = {
  user: tEthereumAddress;
  nftAsset: tEthereumAddress;
  nftTokenId: string;
};
