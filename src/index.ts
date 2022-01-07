// tx builder imports
import IERC20ServiceInterface from './tx-builder/interfaces/ERC20';
import FaucetInterface from './tx-builder/interfaces/Faucet';
// math imports
import * as v1 from './v1';

// export helpers
export * from './helpers/bignumber';
export * from './helpers/constants';
export * from './helpers/pool-math';
export * from './helpers/ray-math';

// export current version (v1) as top-level
export * from './v1';

// export bend as dedicated entry points
export { v1 };

// reexport bignumber
export { BigNumber } from 'bignumber.js';

export { default as TxBuilder } from './tx-builder/protocol';
export { default as LendPoolInterface } from './tx-builder/interfaces/LendPool';

export * from './tx-builder/types';
export * from './tx-builder/types/WethGatewayMethodTypes';
export * from './tx-builder/types/LendPoolMethodTypes';
export * from './tx-builder/types/FaucetMethodTypes';
export {
  ClaimRewardsMethodType,
  IncentivesControllerInterface,
} from './tx-builder/services/IncentivesController';

export * from './tx-builder/config';

export { IERC20ServiceInterface, FaucetInterface };
