import { ethers, providers } from 'ethers';
import FaucetInterface from './interfaces/Faucet';
import IERC20ServiceInterface from './interfaces/ERC20';
import IERC721ServiceInterface from './interfaces/ERC721';
import ICryptoPunksServiceInterface from './interfaces/CryptoPunks';
import ERC20Service from './services/ERC20';
import ERC721Service from './services/ERC721';
import FaucetService from './services/Faucet';
import CryptoPunksService from './services/CryptoPunks';
import {
  ChainId,
  Configuration,
  DefaultProviderKeys,
  Network,
  TxBuilderConfig,
} from './types';
import IncentivesController, {
  IncentivesControllerInterface,
} from './services/IncentivesController';
import { defaultConfig } from './config/defaultConfig';

export default class BaseTxBuilder {
  readonly configuration: Configuration;

  public erc20Service: IERC20ServiceInterface;

  public erc721Service: IERC721ServiceInterface;

  public incentiveService: IncentivesControllerInterface;

  readonly punkServices: { [market: string]: ICryptoPunksServiceInterface };

  readonly faucets: { [market: string]: FaucetInterface };

  readonly txBuilderConfig: TxBuilderConfig;

  constructor(
    network: Network = Network.mainnet,
    injectedProvider?: providers.Provider | string | undefined,
    defaultProviderKeys?: DefaultProviderKeys,
    config: TxBuilderConfig = defaultConfig
  ) {
    this.txBuilderConfig = config;
    let provider: providers.Provider;
    // TODO: this is probably not enough as we use network down the road
    const chainId = ChainId[network];

    if (!injectedProvider) {
      if (defaultProviderKeys && Object.keys(defaultProviderKeys).length > 1) {
        provider = ethers.getDefaultProvider(network, defaultProviderKeys);
      } else {
        provider = ethers.getDefaultProvider(network);
        console.log(
          `These API keys are a provided as a community resource by the backend services for low-traffic projects and for early prototyping.
          It is highly recommended to use own keys: https://docs.ethers.io/v5/api-keys/`
        );
      }
    } else if (typeof injectedProvider === 'string') {
      provider = new providers.StaticJsonRpcProvider(injectedProvider, chainId);
    } else if (injectedProvider instanceof providers.Provider) {
      provider = injectedProvider;
    } else {
      provider = new providers.Web3Provider(injectedProvider, chainId);
    }

    this.configuration = { network, provider };

    this.erc20Service = new ERC20Service(this.configuration);
    this.erc721Service = new ERC721Service(this.configuration);

    this.incentiveService = new IncentivesController(
      this.configuration,
      this.txBuilderConfig.incentives?.[network]
    );

    this.faucets = {};
    this.punkServices = {};
  }

  public getFaucet = (market: string): FaucetInterface => {
    if (!this.faucets[market]) {
      const { network } = this.configuration;
      this.faucets[market] = new FaucetService(
        this.configuration,
        this.txBuilderConfig.lendPool?.[network]?.[market]
      );
    }
    return this.faucets[market];
  };

  public getCryptoPunks = (market: string): ICryptoPunksServiceInterface => {
    if (!this.punkServices[market]) {
      const { network } = this.configuration;
      this.punkServices[market] = new CryptoPunksService(
        this.configuration,
        this.txBuilderConfig.lendPool?.[network]?.[market]
      );
    }
    return this.punkServices[market];
  };
}
