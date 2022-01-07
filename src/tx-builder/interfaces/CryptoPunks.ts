import { tEthereumAddress, EthereumTransactionTypeExtended } from '../types';

export default interface ICryptoPunksServiceInterface {
  isPunkForSaleToAddress: (
    user: string,
    punkIndex: string,
    toAddress: tEthereumAddress
  ) => Promise<boolean>;
  offerPunkForSaleToAddress: (
    user: string,
    punkIndex: string,
    minSalePrice: string,
    toAddress: tEthereumAddress
  ) => EthereumTransactionTypeExtended;
}
