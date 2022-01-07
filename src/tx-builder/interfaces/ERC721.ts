import {
  tEthereumAddress,
  EthereumTransactionTypeExtended,
  TokenMetadataType,
} from '../types';

export default interface IERC721ServiceInterface {
  getTokenData: (token: tEthereumAddress) => Promise<TokenMetadataType>;
  isApprovedForAll: (
    token: tEthereumAddress,
    user: tEthereumAddress,
    operator: tEthereumAddress
  ) => Promise<boolean>;
  setApprovalForAll: (
    token: tEthereumAddress,
    user: tEthereumAddress,
    operator: tEthereumAddress,
    approved: boolean
  ) => EthereumTransactionTypeExtended;
}
