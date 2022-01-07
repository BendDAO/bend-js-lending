import { EthereumTransactionTypeExtended } from '../types';
import {
  WETHBorrowParamsType,
  WETHDepositParamsType,
  WETHRepayParamsType,
  WETHWithdrawParamsType,
  WETHAuctionParamsType,
  WETHRedeemParamsType,
  WETHLiquidateParamsType,
} from '../types/WethGatewayMethodTypes';

export default interface WETHGatewayInterface {
  depositETH: (
    args: WETHDepositParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  withdrawETH: (
    args: WETHWithdrawParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;

  borrowETH: (
    args: WETHBorrowParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  repayETH: (
    args: WETHRepayParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;

  auctionETH: (
    args: WETHAuctionParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  redeemETH: (
    args: WETHRedeemParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  liquidateETH: (
    args: WETHLiquidateParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
}
