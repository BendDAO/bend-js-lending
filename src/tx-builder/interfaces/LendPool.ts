import { EthereumTransactionTypeExtended } from '../types';
import {
  LPDepositParamsType,
  LPWithdrawParamsType,
  LPBorrowParamsType,
  LPRepayParamsType,
  LPAuctionParamsType,
  LPRedeemParamsType,
  LPLiquidateParamsType,
} from '../types/LendPoolMethodTypes';

export default interface LendPoolInterface {
  deposit: (
    args: LPDepositParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  withdraw: (
    args: LPWithdrawParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;

  borrow: (
    args: LPBorrowParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  repay: (
    args: LPRepayParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;

  auction: (
    args: LPAuctionParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  redeem: (
    args: LPRedeemParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
  liquidate: (
    args: LPLiquidateParamsType
  ) => Promise<EthereumTransactionTypeExtended[]>;
}
