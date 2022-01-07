import { constants } from 'ethers';
import {
  API_ETH_MOCK_ADDRESS,
  DEFAULT_APPROVE_AMOUNT,
  DEFAULT_NULL_VALUE_ON_TX,
} from '../config';
import { ILendPool, ILendPool__factory } from '../contract-types';
import IERC20ServiceInterface from '../interfaces/ERC20';
import IERC721ServiceInterface from '../interfaces/ERC721';
import LendPoolInterface from '../interfaces/LendPool';
import {
  Configuration,
  eEthereumTxType,
  EthereumTransactionTypeExtended,
  ProtocolAction,
  transactionType,
  tStringDecimalUnits,
  LendPoolMarketConfig,
} from '../types';
import { getTxValue, parseNumber } from '../utils/parsings';
import { LPValidator } from '../validators/methodValidators';
import {
  LPDepositParamsType,
  LPWithdrawParamsType,
  LPBorrowParamsType,
  LPRepayParamsType,
  LPAuctionParamsType,
  LPRedeemParamsType,
  LPLiquidateParamsType,
} from '../types/LendPoolMethodTypes';
import WETHGatewayInterface from '../interfaces/WETHGateway';
import PunkGatewayInterface from '../interfaces/PunkGateway';
import {
  IsEthAddress,
  IsPositiveAmount,
  IsPositiveOrMinusOneAmount,
} from '../validators/paramValidators';
import BaseService from './BaseService';

export default class LendPool
  extends BaseService<ILendPool>
  implements LendPoolInterface
{
  readonly market: string;

  readonly erc20Service: IERC20ServiceInterface;

  readonly erc721Service: IERC721ServiceInterface;

  readonly lendPoolAddress: string;

  readonly wethGatewayService: WETHGatewayInterface;

  readonly punkGatewayService: PunkGatewayInterface;

  readonly lendPoolConfig: LendPoolMarketConfig | undefined;

  constructor(
    config: Configuration,
    erc20Service: IERC20ServiceInterface,
    erc721Service: IERC721ServiceInterface,
    wethGatewayService: WETHGatewayInterface,
    punkGatewayService: PunkGatewayInterface,
    market: string,
    lendPoolConfig: LendPoolMarketConfig | undefined
  ) {
    super(config, ILendPool__factory);
    this.erc20Service = erc20Service;
    this.erc721Service = erc721Service;
    this.wethGatewayService = wethGatewayService;
    this.punkGatewayService = punkGatewayService;
    this.market = market;
    this.lendPoolConfig = lendPoolConfig;

    const { LEND_POOL } = this.lendPoolConfig || {};

    this.lendPoolAddress = LEND_POOL || '';
  }

  @LPValidator
  public async deposit(
    @IsEthAddress('user')
    @IsEthAddress('reserve')
    @IsPositiveAmount('amount')
    @IsEthAddress('onBehalfOf')
    { user, reserve, amount, onBehalfOf, referralCode }: LPDepositParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    if (reserve.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase()) {
      return this.wethGatewayService.depositETH({
        user,
        amount,
        onBehalfOf,
        referralCode,
      });
    }
    const { isApproved, approve, decimalsOf }: IERC20ServiceInterface =
      this.erc20Service;
    const txs: EthereumTransactionTypeExtended[] = [];
    const reserveDecimals: number = await decimalsOf(reserve);
    const convertedAmount: tStringDecimalUnits = parseNumber(
      amount,
      reserveDecimals
    );

    const approved = await isApproved(
      reserve,
      user,
      this.lendPoolAddress,
      amount
    );
    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = approve(
        user,
        reserve,
        this.lendPoolAddress,
        DEFAULT_APPROVE_AMOUNT
      );
      txs.push(approveTx);
    }

    const lendPoolContract: ILendPool = this.getContractInstance(
      this.lendPoolAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        lendPoolContract.populateTransaction.deposit(
          reserve,
          convertedAmount,
          onBehalfOf || user,
          referralCode || '0'
        ),
      from: user,
      value: getTxValue(reserve, convertedAmount),
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.deposit
      ),
    });

    return txs;
  }

  @LPValidator
  public async withdraw(
    @IsEthAddress('user')
    @IsEthAddress('reserve')
    @IsPositiveOrMinusOneAmount('amount')
    @IsEthAddress('onBehalfOf')
    { user, reserve, amount, onBehalfOf }: LPWithdrawParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const { decimalsOf }: IERC20ServiceInterface = this.erc20Service;
    const decimals: number = await decimalsOf(reserve);

    const convertedAmount: tStringDecimalUnits =
      amount === '-1'
        ? constants.MaxUint256.toString()
        : parseNumber(amount, decimals);

    const lendPoolContract: ILendPool = this.getContractInstance(
      this.lendPoolAddress
    );

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        lendPoolContract.populateTransaction.withdraw(
          reserve,
          convertedAmount,
          onBehalfOf || user
        ),
      from: user,
      action: ProtocolAction.withdraw,
    });

    return [
      {
        tx: txCallback,
        txType: eEthereumTxType.DLP_ACTION,
        gas: this.generateTxPriceEstimation(
          [],
          txCallback,
          ProtocolAction.withdraw
        ),
      },
    ];
  }

  @LPValidator
  public async borrow(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    @IsEthAddress('reserve')
    @IsPositiveAmount('amount')
    @IsEthAddress('onBehalfOf')
    {
      user,
      reserve,
      amount,
      nftAsset,
      nftTokenId,
      onBehalfOf,
      referralCode,
    }: LPBorrowParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const { decimalsOf }: IERC20ServiceInterface = this.erc20Service;
    const { isApprovedForAll, setApprovalForAll }: IERC721ServiceInterface =
      this.erc721Service;
    const txs: EthereumTransactionTypeExtended[] = [];
    const reserveDecimals = await decimalsOf(reserve);
    const formatAmount: tStringDecimalUnits = parseNumber(
      amount,
      reserveDecimals
    );

    const approved = await isApprovedForAll(
      nftAsset,
      user,
      this.lendPoolAddress
    );
    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = setApprovalForAll(
        nftAsset,
        user,
        this.lendPoolAddress,
        true
      );
      txs.push(approveTx);
    }

    const lendPoolContract = this.getContractInstance(this.lendPoolAddress);

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        lendPoolContract.populateTransaction.borrow(
          reserve,
          formatAmount,
          nftAsset,
          nftTokenId,
          referralCode || '0',
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
        ProtocolAction.repay
      ),
    });

    return txs;
  }

  @LPValidator
  public async repay(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    @IsEthAddress('reserve')
    @IsPositiveOrMinusOneAmount('amount')
    @IsEthAddress('onBehalfOf')
    { user, nftAsset, nftTokenId, reserve, amount }: LPRepayParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];
    const { isApproved, approve, decimalsOf }: IERC20ServiceInterface =
      this.erc20Service;

    const lendPoolContract = this.getContractInstance(this.lendPoolAddress);
    const { populateTransaction }: ILendPool = lendPoolContract;
    const decimals: number = await decimalsOf(reserve);

    const convertedAmount: tStringDecimalUnits =
      amount === '-1'
        ? constants.MaxUint256.toString()
        : parseNumber(amount, decimals);

    const approved: boolean = await isApproved(
      reserve,
      user,
      this.lendPoolAddress,
      amount
    );

    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = approve(
        user,
        reserve,
        this.lendPoolAddress,
        DEFAULT_APPROVE_AMOUNT
      );
      txs.push(approveTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        populateTransaction.repay(nftAsset, nftTokenId, convertedAmount),
      from: user,
      value: getTxValue(reserve, convertedAmount),
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.repay
      ),
    });

    return txs;
  }

  @LPValidator
  public async auction(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    @IsEthAddress('reserve')
    @IsPositiveOrMinusOneAmount('bidPrice')
    @IsEthAddress('onBehalfOf')
    {
      user,
      nftAsset,
      nftTokenId,
      reserve,
      bidPrice,
      onBehalfOf,
    }: LPAuctionParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];
    const { isApproved, approve, decimalsOf }: IERC20ServiceInterface =
      this.erc20Service;

    const lendPoolContract = this.getContractInstance(this.lendPoolAddress);
    const { populateTransaction }: ILendPool = lendPoolContract;
    const decimals: number = await decimalsOf(reserve);

    const convertedAmount: tStringDecimalUnits =
      bidPrice === '-1'
        ? constants.MaxUint256.toString()
        : parseNumber(bidPrice, decimals);

    const approved: boolean = await isApproved(
      reserve,
      user,
      this.lendPoolAddress,
      bidPrice
    );

    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = approve(
        user,
        reserve,
        this.lendPoolAddress,
        DEFAULT_APPROVE_AMOUNT
      );
      txs.push(approveTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        populateTransaction.auction(
          nftAsset,
          nftTokenId,
          convertedAmount,
          onBehalfOf || user
        ),
      from: user,
      value: getTxValue(reserve, convertedAmount),
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.repay
      ),
    });

    return txs;
  }

  @LPValidator
  public async redeem(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    { user, nftAsset, nftTokenId, reserve, amount }: LPRedeemParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];
    const { isApproved, approve, decimalsOf }: IERC20ServiceInterface =
      this.erc20Service;

    const lendPoolContract = this.getContractInstance(this.lendPoolAddress);
    const { populateTransaction }: ILendPool = lendPoolContract;
    const decimals: number = await decimalsOf(reserve);

    const convertedAmount: tStringDecimalUnits =
      amount === '-1'
        ? constants.MaxUint256.toString()
        : parseNumber(amount, decimals);

    const approved: boolean = await isApproved(
      reserve,
      user,
      this.lendPoolAddress,
      convertedAmount
    );

    if (!approved) {
      const approveTx: EthereumTransactionTypeExtended = approve(
        user,
        reserve,
        this.lendPoolAddress,
        DEFAULT_APPROVE_AMOUNT
      );
      txs.push(approveTx);
    }

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () => populateTransaction.redeem(nftAsset, nftTokenId),
      from: user,
      value: getTxValue(reserve, convertedAmount),
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.repay
      ),
    });

    return txs;
  }

  @LPValidator
  public async liquidate(
    @IsEthAddress('user')
    @IsEthAddress('nftAsset')
    @IsPositiveAmount('nftTokenId')
    { user, nftAsset, nftTokenId }: LPLiquidateParamsType
  ): Promise<EthereumTransactionTypeExtended[]> {
    const txs: EthereumTransactionTypeExtended[] = [];

    const lendPoolContract = this.getContractInstance(this.lendPoolAddress);
    const { populateTransaction }: ILendPool = lendPoolContract;

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () => populateTransaction.redeem(nftAsset, nftTokenId),
      from: user,
      value: DEFAULT_NULL_VALUE_ON_TX,
    });

    txs.push({
      tx: txCallback,
      txType: eEthereumTxType.DLP_ACTION,
      gas: this.generateTxPriceEstimation(
        txs,
        txCallback,
        ProtocolAction.repay
      ),
    });

    return txs;
  }
}
