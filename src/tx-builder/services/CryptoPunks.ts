import ICryptoPunksServiceInterface from '../interfaces/CryptoPunks';
import {
  Configuration,
  eEthereumTxType,
  EthereumTransactionTypeExtended,
  LendPoolMarketConfig,
  tEthereumAddress,
  transactionType,
  tStringDecimalUnits,
} from '../types';
import { IPunks, IPunks__factory } from '../contract-types';
import BaseService from './BaseService';
import { parseNumber } from 'tx-builder/utils/parsings';

export default class CryptoPunksService
  extends BaseService<IPunks>
  implements ICryptoPunksServiceInterface
{
  readonly punkConfig: LendPoolMarketConfig | undefined;

  readonly punkAddress: string;

  readonly punkContract: IPunks;

  constructor(config: Configuration, punkConfig: LendPoolMarketConfig | undefined) {
    super(config, IPunks__factory);

    this.punkConfig = punkConfig;
    this.punkAddress = this.punkConfig?.CRYPTO_PUNKS || '';
    this.punkContract = this.getContractInstance(this.punkAddress);
  }

  public offerPunkForSaleToAddress = (
    user: string,
    punkIndex: string,
    amount: string,
    toAddress: tEthereumAddress
  ): EthereumTransactionTypeExtended => {
    const convertedAmount: tStringDecimalUnits = parseNumber(amount, 18);

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
      this.punkContract.populateTransaction.offerPunkForSaleToAddress(punkIndex, convertedAmount, toAddress),
      from: user,
    });

    return {
      tx: txCallback,
      txType: eEthereumTxType.ERC20_APPROVAL,
      gas: this.generateTxPriceEstimation([], txCallback),
    };
  };

  public isPunkForSaleToAddress = async (
    user: string,
    punkIndex: string,
    toAddress: tEthereumAddress
  ): Promise<boolean> => {
    user;

    const { onlySellTo } = await this.punkContract.punksOfferedForSale(punkIndex);
    return onlySellTo == toAddress;
  };
}
