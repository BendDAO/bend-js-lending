import IERC20ServiceInterface from './ERC20';
import IERC721ServiceInterface from './ERC721';
import ICryptoPunksServiceInterface from './CryptoPunks';
import LendPoolInterface from './LendPool';
import WETHGatewayInterface from './WETHGateway';
import PunkGatewayInterface from './PunkGateway';
import { IncentivesControllerInterface } from '../services/IncentivesController';

export default interface TxBuilderInterface {
  erc20Service: IERC20ServiceInterface;
  erc721Service: IERC721ServiceInterface;
  incentiveService: IncentivesControllerInterface;

  getLendPool: (market: string) => LendPoolInterface;
  getWethGateway: (market: string) => WETHGatewayInterface;
  getPunkGateway: (market: string) => PunkGatewayInterface;

  getCryptoPunks: (market: string) => ICryptoPunksServiceInterface;
}
