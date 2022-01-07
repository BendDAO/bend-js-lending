import IERC721ServiceInterface from '../interfaces/ERC721';
import {
  Configuration,
  eEthereumTxType,
  EthereumTransactionTypeExtended,
  tEthereumAddress,
  transactionType,
  TokenMetadataType,
} from '../types';
import { IERC721Detailed, IERC20Detailed__factory } from '../contract-types';
import BaseService from './BaseService';

export default class ERC721Service
  extends BaseService<IERC721Detailed>
  implements IERC721ServiceInterface
{
  constructor(config: Configuration) {
    super(config, IERC20Detailed__factory);
  }

  public setApprovalForAll = (
    token: tEthereumAddress,
    user: tEthereumAddress,
    operator: tEthereumAddress,
    approved: boolean
  ): EthereumTransactionTypeExtended => {
    const erc721Contract = this.getContractInstance(token);

    const txCallback: () => Promise<transactionType> = this.generateTxCallback({
      rawTxMethod: () =>
        erc721Contract.populateTransaction.setApprovalForAll(
          operator,
          approved
        ),
      from: user,
    });

    return {
      tx: txCallback,
      txType: eEthereumTxType.ERC20_APPROVAL,
      gas: this.generateTxPriceEstimation([], txCallback),
    };
  };

  public isApprovedForAll = async (
    token: tEthereumAddress,
    user: tEthereumAddress,
    operator: tEthereumAddress
  ): Promise<boolean> => {
    const erc721Contract: IERC721Detailed = this.getContractInstance(token);
    const approved: boolean = await erc721Contract.isApprovedForAll(
      user,
      operator
    );
    return approved;
  };

  public getTokenData = async (
    token: tEthereumAddress
  ): Promise<TokenMetadataType> => {
    const { name: nameGetter, symbol: symbolGetter }: IERC721Detailed =
      this.getContractInstance(token);

    const [name, symbol]: [string, string] = await Promise.all([
      nameGetter(),
      symbolGetter(),
    ]);

    let customSymbol: string = symbol;
    if (name == 'CryptoPunks') {
      customSymbol = 'Punks';
    }

    return {
      name: name,
      symbol: customSymbol,
      decimals: 0,
      address: token,
    };
  };
}
