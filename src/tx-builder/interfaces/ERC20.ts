import {
  tEthereumAddress,
  tStringCurrencyUnits,
  EthereumTransactionTypeExtended,
  tStringDecimalUnits,
  TokenMetadataType,
} from '../types';

export default interface IERC20ServiceInterface {
  decimalsOf: (token: tEthereumAddress) => Promise<number>;
  getTokenData: (token: tEthereumAddress) => Promise<TokenMetadataType>;
  isApproved: (
    token: tEthereumAddress,
    user: tEthereumAddress,
    spender: tEthereumAddress,
    amount: tStringCurrencyUnits
  ) => Promise<boolean>;
  approve: (
    token: tEthereumAddress,
    user: tEthereumAddress,
    spender: tEthereumAddress,
    amount: tStringDecimalUnits
  ) => EthereumTransactionTypeExtended;
}
