import { constants } from 'ethers';
import ICryptoPunksServiceInterface from 'tx-builder/interfaces/CryptoPunks';
import { DEFAULT_APPROVE_AMOUNT, DEFAULT_NULL_VALUE_ON_TX } from '../..';
import { IPunkGateway, IPunkGateway__factory } from '../contract-types';
import IERC20ServiceInterface from '../interfaces/ERC20';
import IERC721ServiceInterface from '../interfaces/ERC721';
import PunkGatewayInterface from '../interfaces/PunkGateway';
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
import { parseNumber } from '../utils/parsings';
import { PunkValidator } from '../validators/methodValidators';
import { IsEthAddress, IsPositiveAmount } from '../validators/paramValidators';
import BaseService from './BaseService';

export default class PunkGatewayService
  extends BaseService<IPunkGateway>
  implements PunkGatewayInterface
{
  readonly punkGatewayAddress: string;
  readonly punkAddress: string;
  readonly wpunkAddress: string;

  readonly config: Configuration;

  readonly erc20Service: IERC20ServiceInterface;

  readonly erc721Service: IERC721ServiceInterface;

  readonly punkService: ICryptoPunksServiceInterface;

  readonly punkGatewayConfig: LendPoolMarketConfig | undefined;

  constructor(
    config: Configuration,
    erc20Service: IERC20ServiceInterface,
    erc721Service: IERC721ServiceInterface,
    punkService: ICryptoPunksServiceInterface,
    punkGatewayConfig: LendPoolMarketConfig | undefined
  ) {
    super(config, IPunkGateway__factory);

    this.punkGatewayConfig = punkGatewayConfig;

    this.erc20Service = erc20Service;
    this.erc721Service = erc721Service;
    this.punkService = punkService;

    this.punkGatewayAddress = this.punkGatewayConfig?.PUNK_GATEWAY || '';
  }

  @PunkValidator
  public async borrow(
    @IsEthAddress('user')
    @IsEthAddress('reserve')
    @IsPositiveAmount('amount')
    @IsPositiveAmount('punkIndex')
    @IsEthAddress('onBehalfOf')
    {
      user,
      reserve,
      amount,
      punkIndex,
      onBehalfOf,
      referralCode,
    }: PunkERC20BorrowParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const decimals: number = await this.erc20Service.decimalsOf(reserve);
    const convertedAmount: tStringDecimalUnits =
      amount === '-1'
        ? constants.MaxUint256.toString()
        : parseNumber(amount, decimals);

    // check punk is saled to gateway
    const saled = await this.punkService.isPunkForSaleToAddress(
      user,
      punkIndex,
      this.punkGatewayAddress
    );
    if (!saled) {
      const approveTx: EthereumTransactionTypeExtended =
        this.punkService.offerPunkForSaleToAddress(
          user,
          punkIndex,
          '0',
          this.punkGatewayAddress
        );
      txs.push(approveTx);
    }

    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.borrow(
          reserve,
          convertedAmount,
          punkIndex,
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
        ProtocolAction.borrow
      ),
    });

    return txs;
  }

  @PunkValidator
  public async repay(
    @IsEthAddress('user')
    @IsPositiveAmount('punkIndex')
    @IsPositiveAmount('amount')
    { user, punkIndex, reserve, amount }: PunkERC20RepayParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const decimals: number = await this.erc20Service.decimalsOf(reserve);
    const convertedAmount: tStringDecimalUnits =
      amount === '-1'
        ? constants.MaxUint256.toString()
        : parseNumber(amount, decimals);

    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    // check erc20 approve
    const approvedErc20: boolean = await this.erc20Service.isApproved(
      reserve,
      user,
      this.punkGatewayAddress,
      amount
    );
    if (!approvedErc20) {
      const approveTx: EthereumTransactionTypeExtended =
        this.erc20Service.approve(
          user,
          reserve,
          this.punkGatewayAddress,
          DEFAULT_APPROVE_AMOUNT
        );
      txs.push(approveTx);
    }

    // check erc721 approve
    const wpunkAddress = await punkGatewayContract.wrappedPunks();
    const approvedErc721 = await this.erc721Service.isApprovedForAll(
      wpunkAddress,
      user,
      this.punkGatewayAddress
    );
    if (!approvedErc721) {
      const approveTx: EthereumTransactionTypeExtended =
        this.erc721Service.setApprovalForAll(
          wpunkAddress,
          user,
          this.punkGatewayAddress,
          true
        );
      txs.push(approveTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.repay(
          punkIndex,
          convertedAmount
        ),
      gasSurplus: 30,
      from: user,
      value: DEFAULT_NULL_VALUE_ON_TX,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation([], txCallback),
    });
    return txs;
  }

  @PunkValidator
  public async auction(
    @IsEthAddress('user')
    @IsPositiveAmount('punkIndex')
    @IsPositiveAmount('bidPrice')
    @IsEthAddress('onBehalfOf')
    {
      user,
      punkIndex,
      reserve,
      bidPrice,
      onBehalfOf,
    }: PunkERC20AuctionParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const decimals: number = await this.erc20Service.decimalsOf(reserve);
    const convertedAmount: tStringDecimalUnits =
      bidPrice === '-1'
        ? constants.MaxUint256.toString()
        : parseNumber(bidPrice, decimals);

    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    // check erc20 approve
    const approvedErc20: boolean = await this.erc20Service.isApproved(
      reserve,
      user,
      this.punkGatewayAddress,
      convertedAmount
    );
    if (!approvedErc20) {
      const approveTx: EthereumTransactionTypeExtended =
        this.erc20Service.approve(
          user,
          reserve,
          this.punkGatewayAddress,
          DEFAULT_APPROVE_AMOUNT
        );
      txs.push(approveTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.auction(
          punkIndex,
          convertedAmount,
          onBehalfOf || user
        ),
      gasSurplus: 30,
      from: user,
      value: DEFAULT_NULL_VALUE_ON_TX,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation([], txCallback),
    });

    return txs;
  }

  @PunkValidator
  public async redeem(
    @IsEthAddress('user')
    @IsPositiveAmount('punkIndex')
    @IsPositiveAmount('amount')
    { user, punkIndex, reserve, amount }: PunkERC20RedeemParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);

    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    // check erc20 approve
    const approvedErc20: boolean = await this.erc20Service.isApproved(
      reserve,
      user,
      this.punkGatewayAddress,
      convertedAmount
    );
    if (!approvedErc20) {
      const approveTx: EthereumTransactionTypeExtended =
        this.erc20Service.approve(
          user,
          reserve,
          this.punkGatewayAddress,
          DEFAULT_APPROVE_AMOUNT
        );
      txs.push(approveTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.redeem(punkIndex),
      gasSurplus: 30,
      from: user,
      value: DEFAULT_NULL_VALUE_ON_TX,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation([], txCallback),
    });

    return txs;
  }

  @PunkValidator
  public async liquidate(
    @IsEthAddress('user')
    @IsPositiveAmount('punkIndex')
    { user, punkIndex }: PunkERC20LiquidateParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    // check erc721 approve
    const wpunkAddress = await punkGatewayContract.wrappedPunks();
    const approvedErc721 = await this.erc721Service.isApprovedForAll(
      wpunkAddress,
      user,
      this.punkGatewayAddress
    );
    if (!approvedErc721) {
      const approveTx: EthereumTransactionTypeExtended =
        this.erc721Service.setApprovalForAll(
          wpunkAddress,
          user,
          this.punkGatewayAddress,
          true
        );
      txs.push(approveTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.liquidate(punkIndex),
      gasSurplus: 30,
      from: user,
      value: DEFAULT_NULL_VALUE_ON_TX,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation([], txCallback),
    });

    return txs;
  }

  @PunkValidator
  public async borrowETH(
    @IsEthAddress('user')
    @IsEthAddress('wpunkAddress')
    @IsPositiveAmount('punkIndex')
    @IsPositiveAmount('amount')
    @IsEthAddress('onBehalfOf')
    {
      user,
      amount,
      wpunkAddress,
      punkIndex,
      onBehalfOf,
      referralCode,
    }: PunkETHBorrowParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const { isApprovedForAll, setApprovalForAll }: IERC721ServiceInterface =
      this.erc721Service;
    const txs: EthereumTransactionTypeExtended[] = [];
    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);

    const saled = await this.punkService.isPunkForSaleToAddress(
      user,
      punkIndex,
      this.punkGatewayAddress
    );
    if (!saled) {
      const approveTx: EthereumTransactionTypeExtended =
        this.punkService.offerPunkForSaleToAddress(
          user,
          punkIndex,
          '0',
          this.punkGatewayAddress
        );
      txs.push(approveTx);
    }

    const approved = await isApprovedForAll(
      wpunkAddress,
      user,
      this.punkGatewayAddress
    );
    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = setApprovalForAll(
        wpunkAddress,
        user,
        this.punkGatewayAddress,
        true
      );
      txs.push(approveTx);
    }

    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.borrowETH(
          convertedAmount,
          punkIndex,
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

  @PunkValidator
  public async repayETH(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    @IsPositiveAmount('amount')
    { user, punkIndex, amount }: PunkETHRepayParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);
    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.repayETH(
          punkIndex,
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

  @PunkValidator
  public async auctionETH(
    @IsEthAddress('user')
    @IsPositiveAmount('punkIndex')
    @IsPositiveAmount('amount')
    @IsEthAddress('onBehalfOf')
    { user, punkIndex, bidPrice, onBehalfOf }: PunkETHAuctionParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const convertedAmount: tStringDecimalUnits = parseNumber(bidPrice, 18);
    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.auctionETH(
          punkIndex,
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

  @PunkValidator
  public async redeemETH(
    @IsEthAddress('user')
    @IsPositiveAmount('punkIndex')
    @IsPositiveAmount('amount')
    { user, punkIndex, amount }: PunkETHRedeemParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);
    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.redeemETH(punkIndex),
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

  @PunkValidator
  public async liquidateETH(
    @IsEthAddress('user')
    @IsPositiveAmount('punkIndex')
    { user, punkIndex }: PunkETHLiquidateParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const punkGatewayContract: IPunkGateway = this.getContractInstance(
      this.punkGatewayAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        punkGatewayContract.populateTransaction.liquidateETH(punkIndex),
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
