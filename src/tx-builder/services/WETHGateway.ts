import { constants } from 'ethers';
import { IWETHGateway, IWETHGateway__factory } from '../contract-types';
import IERC20ServiceInterface from '../interfaces/ERC20';
import IERC721ServiceInterface from '../interfaces/ERC721';
import WETHGatewayInterface from '../interfaces/WETHGateway';
import {
  Configuration,
  eEthereumTxType,
  EthereumTransactionTypeExtended,
  LendPoolMarketConfig,
  ProtocolAction,
  transactionType,
  tStringDecimalUnits,
} from '../types';
import {
  WETHDepositParamsType,
  WETHWithdrawParamsType,
  WETHBorrowParamsType,
  WETHRepayParamsType,
  WETHAuctionParamsType,
  WETHRedeemParamsType,
  WETHLiquidateParamsType,
} from '../types/WethGatewayMethodTypes';
import { parseNumber } from '../utils/parsings';
import { WETHValidator } from '../validators/methodValidators';
import {
  IsEthAddress,
  IsPositiveAmount,
  IsPositiveOrMinusOneAmount,
} from '../validators/paramValidators';
import BaseService from './BaseService';

export default class WETHGatewayService
  extends BaseService<IWETHGateway>
  implements WETHGatewayInterface
{
  readonly wethGatewayAddress: string;

  readonly config: Configuration;

  readonly erc20Service: IERC20ServiceInterface;

  readonly erc721Service: IERC721ServiceInterface;

  readonly wethGatewayConfig: LendPoolMarketConfig | undefined;

  constructor(
    config: Configuration,
    erc20Service: IERC20ServiceInterface,
    erc721Service: IERC721ServiceInterface,
    wethGatewayConfig: LendPoolMarketConfig | undefined
  ) {
    super(config, IWETHGateway__factory);

    this.wethGatewayConfig = wethGatewayConfig;

    this.erc20Service = erc20Service;
    this.erc721Service = erc721Service;

    this.wethGatewayAddress = this.wethGatewayConfig?.WETH_GATEWAY || '';
  }

  @WETHValidator
  public async depositETH(
    @IsEthAddress('user')
    @IsEthAddress('onBehalfOf')
    @IsPositiveAmount('amount')
    { user, amount, onBehalfOf, referralCode }: WETHDepositParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);

    const wethGatewayContract: IWETHGateway = this.getContractInstance(
      this.wethGatewayAddress
    );
    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        wethGatewayContract.populateTransaction.depositETH(
          onBehalfOf || user,
          referralCode || '0'
        ),
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  @WETHValidator
  public async withdrawETH(
    @IsEthAddress('user')
    @IsEthAddress('bTokenAddress')
    @IsEthAddress('onBehalfOf')
    @IsPositiveOrMinusOneAmount('amount')
    { user, amount, bTokenAddress, onBehalfOf }: WETHWithdrawParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];
    const { isApproved, approve }: IERC20ServiceInterface = this.erc20Service;
    const convertedAmount: tStringDecimalUnits =
      amount === '-1'
        ? constants.MaxUint256.toString()
        : parseNumber(amount, 18);

    const approved: boolean = await isApproved(
      bTokenAddress,
      user,
      this.wethGatewayAddress,
      amount
    );

    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = approve(
        user,
        bTokenAddress,
        this.wethGatewayAddress,
        constants.MaxUint256.toString()
      );
      txs.push(approveTx);
    }
    const wethGatewayContract: IWETHGateway = this.getContractInstance(
      this.wethGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        wethGatewayContract.populateTransaction.withdrawETH(
          convertedAmount,
          onBehalfOf || user
        ),
      from: user,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.withdrawETH
      ),
    });

    return txs;
  }

  @WETHValidator
  public async borrowETH(
    @IsEthAddress('user')
    @IsPositiveAmount('amount')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    @IsEthAddress('onBehalfOf')
    {
      user,
      amount,
      nftAsset,
      nftTokenId,
      onBehalfOf,
      referralCode,
    }: WETHBorrowParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const { isApprovedForAll, setApprovalForAll }: IERC721ServiceInterface =
      this.erc721Service;
    const txs: EthereumTransactionTypeExtended[] = [];
    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);

    const approved = await isApprovedForAll(
      nftAsset,
      user,
      this.wethGatewayAddress
    );
    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = setApprovalForAll(
        nftAsset,
        user,
        this.wethGatewayAddress,
        true
      );
      txs.push(approveTx);
    }

    const wethGatewayContract: IWETHGateway = this.getContractInstance(
      this.wethGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        wethGatewayContract.populateTransaction.borrowETH(
          convertedAmount,
          nftAsset,
          nftTokenId,
          onBehalfOf || user,
          referralCode || '0'
        ),
      from: user,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.borrowETH
      ),
    });

    return txs;
  }

  @WETHValidator
  public async repayETH(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    @IsPositiveAmount('amount')
    { user, nftAsset, nftTokenId, amount }: WETHRepayParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);
    const wethGatewayContract: IWETHGateway = this.getContractInstance(
      this.wethGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        wethGatewayContract.populateTransaction.repayETH(
          nftAsset,
          nftTokenId,
          convertedAmount
        ),
      gasSurplus: 30,
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  @WETHValidator
  public async auctionETH(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    @IsPositiveAmount('amount')
    @IsEthAddress('onBehalfOf')
    { user, nftAsset, nftTokenId, bidPrice, onBehalfOf }: WETHAuctionParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const convertedAmount: tStringDecimalUnits = parseNumber(bidPrice, 18);
    const wethGatewayContract: IWETHGateway = this.getContractInstance(
      this.wethGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        wethGatewayContract.populateTransaction.auctionETH(
          nftAsset,
          nftTokenId,
          onBehalfOf || user
        ),
      gasSurplus: 30,
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  @WETHValidator
  public async redeemETH(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    @IsPositiveAmount('amount')
    { user, nftAsset, nftTokenId, amount }: WETHRedeemParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);
    const wethGatewayContract: IWETHGateway = this.getContractInstance(
      this.wethGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        wethGatewayContract.populateTransaction.redeemETH(nftAsset, nftTokenId),
      gasSurplus: 30,
      from: user,
      value: convertedAmount,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }

  @WETHValidator
  public async liquidateETH(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    { user, nftAsset, nftTokenId }: WETHLiquidateParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const wethGatewayContract: IWETHGateway = this.getContractInstance(
      this.wethGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        wethGatewayContract.populateTransaction.liquidateETH(
          nftAsset,
          nftTokenId
        ),
      gasSurplus: 30,
      from: user,
      value: '0',
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation([], txCallback),
      },
    ];
  }
}
