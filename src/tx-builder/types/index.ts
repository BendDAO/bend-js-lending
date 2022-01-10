import { providers, BigNumber, BytesLike, PopulatedTransaction } from 'ethers';

export type tEthereumAddress = string;
export type tStringCurrencyUnits = string; // ex 2.5 eth
export type tStringDecimalUnits = string; // ex 2500000000000000000
export type ENS = string; // something.eth

export enum Market {
  Proto = 'proto',
}

export enum Network {
  mainnet = 'mainnet',
  ropsten = 'ropsten',
  rinkeby = 'rinkeby',
  kovan = 'kovan',
  fork = 'fork',
}

export enum ChainId {
  mainnet = 1,
  ropsten = 3,
  rinkeby = 4,
  kovan = 42,
  fork = 1337,
}
export type ConstantAddressesByNetwork = {
  [network: string]: {
    CRYPTO_PUNKS?: tEthereumAddress;
  };
};

export type IncentivesConfig = {
  INCENTIVES_CONTROLLER: tEthereumAddress;
  INCENTIVES_CONTROLLER_REWARD_TOKEN: tEthereumAddress;
};

export type LendPoolMarketConfig = {
  LEND_POOL: tEthereumAddress;
  WETH_GATEWAY?: tEthereumAddress;
  PUNK_GATEWAY?: tEthereumAddress;
  CRYPTO_PUNKS?: tEthereumAddress;
  FAUCET?: tEthereumAddress;
};

export type LendPoolConfig = {
  [network: string]: {
    [market: string]: LendPoolMarketConfig;
  };
};

export type TxBuilderConfig = {
  lendPool?: LendPoolConfig;
  incentives?: {
    [network: string]: IncentivesConfig;
  };
};

export enum eEthereumTxType {
  ERC20_APPROVAL = 'ERC20_APPROVAL',
  FAUCET_MINT = 'FAUCET_MINT',
  REWARD_ACTION = 'REWARD_ACTION',
  DLP_ACTION = 'DLP_ACTION',
}

export enum ProtocolAction {
  default = 'default',
  deposit = 'deposit',
  withdraw = 'withdraw',
  borrow = 'borrow',
  repay = 'repay',
  auction = 'auction',
  redeem = 'redeem',
  liquidate = 'liquidate',
  depositETH = 'depositETH',
  withdrawETH = 'withdrawETH',
  borrowETH = 'borrwoETH',
  repayETH = 'repayETH',
  auctionETH = 'auctionETH',
  redeemETH = 'redeemETH',
  liquidateETH = 'liquidateETH',
}

export type GasRecommendationType = {
  [action: string]: {
    limit: string;
    recommended: string;
  };
};

export type GeneratedTx = {
  tx: transactionType;
  gas: {
    price: string;
    limit: string;
  };
};

export type transactionType = {
  value?: string;
  from?: string;
  to?: string;
  nonce?: number;
  gasLimit?: BigNumber;
  gasPrice?: BigNumber;
  data?: string;
  chainId?: number;
};

export type AddressModel = {
  ADDRESS_PROVIDER_ADDRESS: tEthereumAddress;
  LENDPOOL_ADDRESS: tEthereumAddress;
  WETH_GATEWAY: tEthereumAddress;
  PUNK_GATEWAY: tEthereumAddress;
  FAUCET: tEthereumAddress;
  INCENTIVES_CONTROLLER: tEthereumAddress;
  INCENTIVES_CONTROLLER_REWARD_TOKEN: tEthereumAddress;
};

export type tCommonContractAddressBetweenMarkets = Pick<
  AddressModel,
  | 'WETH_GATEWAY'
  | 'PUNK_GATEWAY'
  | 'FAUCET'
  | 'INCENTIVES_CONTROLLER'
  | 'INCENTIVES_CONTROLLER_REWARD_TOKEN'
>;

export type tDistinctContractAddressBetweenMarkets = Pick<
  AddressModel,
  'LENDPOOL_ADDRESS'
>;

export type ContractAddresses = {
  [contractName: string]: tEthereumAddress;
};

export type Configuration = {
  network: Network;
  provider: providers.Provider;
};

export type EthereumTransactionTypeExtended = {
  txType: eEthereumTxType;
  tx: () => Promise<transactionType>;
  gas: GasResponse;
};

export type TransactionGenerationMethod = {
  rawTxMethod: () => Promise<PopulatedTransaction>;
  from: tEthereumAddress;
  value?: string;
  gasSurplus?: number;
  action?: ProtocolAction;
};

export type TransactionGasGenerationMethod = {
  txCallback: () => Promise<transactionType>;
  action?: ProtocolAction;
};

export type GasType = {
  gasLimit: string | undefined;
  gasPrice: string;
};
export type GasResponse = (force?: boolean) => Promise<GasType | null>;

export type TokenMetadataType = {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
};

export type DefaultProviderKeys = {
  etherscan?: string;
  infura?: string;
  alchemy?: string;
};

export type CommonConfigType = {
  [network: string]: tCommonContractAddressBetweenMarkets;
};

export type LendPoolConfigType = {
  [pool: string]: {
    [network: string]: tDistinctContractAddressBetweenMarkets;
  };
};

export type EnabledNetworksType = {
  lendPool: {
    [market: string]: Network[];
  };
  wethGateway: Network[];
  punkGateway: Network[];
  faucet: Network[];
  incentivesController: Network[];
};

export type PermitSignature = {
  amount: tStringCurrencyUnits;
  deadline: string;
  v: number;
  r: BytesLike;
  s: BytesLike;
};
