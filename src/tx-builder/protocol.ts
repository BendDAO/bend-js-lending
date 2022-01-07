import { providers } from 'ethers';
import { Network, DefaultProviderKeys, TxBuilderConfig } from './types';
import TxBuilderInterface from './interfaces/TxBuilder';
import LendPoolInterface from './interfaces/LendPool';
import LendPool from './services/LendPool';
import BaseTxBuilder from './txBuilder';
import WETHGatewayInterface from './interfaces/WETHGateway';
import WETHGatewayService from './services/WETHGateway';
import PunkGatewayInterface from './interfaces/PunkGateway';
import PunkGatewayService from './services/PunkGateway';

export default class TxBuilder
  extends BaseTxBuilder
  implements TxBuilderInterface
{
  readonly lendPools: {
    [market: string]: LendPoolInterface;
  };

  readonly wethGateways: {
    [market: string]: WETHGatewayInterface;
  };

  readonly punkGateways: {
    [market: string]: PunkGatewayInterface;
  };

  constructor(
    network: Network = Network.mainnet,
    injectedProvider?: providers.Provider | string | undefined,
    defaultProviderKeys?: DefaultProviderKeys,
    config?: TxBuilderConfig
  ) {
    super(network, injectedProvider, defaultProviderKeys, config);

    this.wethGateways = {};
    this.lendPools = {};
  }

  public getWethGateway = (market: string): WETHGatewayInterface => {
    const { network } = this.configuration;
    if (!this.wethGateways[market]) {
      this.wethGateways[market] = new WETHGatewayService(
        this.configuration,
        this.erc20Service,
        this.erc721Service,
        this.txBuilderConfig.lendPool?.[network]?.[market]
      );
    }

    return this.wethGateways[market];
  };

  public getPunkGateway = (market: string): PunkGatewayInterface => {
    const { network } = this.configuration;
    if (!this.punkGateways[market]) {
      const punkService = this.getCryptoPunks(market);
      this.punkGateways[market] = new PunkGatewayService(
        this.configuration,
        this.erc20Service,
        this.erc721Service,
        punkService,
        this.txBuilderConfig.lendPool?.[network]?.[market]
      );
    }

    return this.punkGateways[market];
  };

  public getLendPool = (market: string): LendPoolInterface => {
    const { network } = this.configuration;
    if (!this.lendPools[market]) {
      this.lendPools[market] = new LendPool(
        this.configuration,
        this.erc20Service,
        this.erc721Service,
        this.getWethGateway(market),
        this.getPunkGateway(market),
        market,
        this.txBuilderConfig.lendPool?.[network]?.[market]
      );
    }

    return this.lendPools[market];
  };
}
