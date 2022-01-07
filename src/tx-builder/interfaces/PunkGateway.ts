import { EthereumTransactionTypeExtended } from '../types';
import {
  PunkERC20BorrowParamsType,
  PunkERC20RepayParamsType,
  PunkERC20AuctionParamsType,
  PunkERC20RedeemParamsType,
  PunkERC20LiquidateParamsType,
  PunkETHBorrowParamsType,
  PunkETHRepayParamsType,
  PunkETHAuctionParamsType,
  PunkETHRedeemParamsType,
  PunkETHLiquidateParamsType,
} from '../types/PunkGatewayMethodTypes';

export default interface WETHGatewayInterface {
  borrow: (
    args: PunkERC20BorrowParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  repay: (
    args: PunkERC20RepayParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  auction: (
    args: PunkERC20AuctionParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  redeem: (
    args: PunkERC20RedeemParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  liquidate: (
    args: PunkERC20LiquidateParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;

  borrowETH: (
    args: PunkETHBorrowParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  repayETH: (
    args: PunkETHRepayParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  auctionETH: (
    args: PunkETHAuctionParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  redeemETH: (
    args: PunkETHRedeemParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  liquidateETH: (
    args: PunkETHLiquidateParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
}
