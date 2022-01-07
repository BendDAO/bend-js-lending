/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  amountGtThan0OrMinus1,
  amountGtThan0Validator,
  isEthAddressValidator,
  optionalValidator,
} from './validations';
import { utils } from 'ethers';

export function LPValidator(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<any>
): any {
  const method = descriptor.value;
  // eslint-disable-next-line no-param-reassign
  descriptor.value = function () {
    const { LENDING_POOL } = this.lendingPoolConfig || {};

    if (!utils.isAddress(LENDING_POOL)) {
      console.error(`[LendingPoolValidator] You need to pass valid addresses`);
      return [];
    }

    isEthAddressValidator(target, propertyName, arguments);

    amountGtThan0Validator(target, propertyName, arguments);

    amountGtThan0OrMinus1(target, propertyName, arguments);

    return method?.apply(this, arguments);
  };
}

export function IncentivesValidator(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<any>
): any {
  const method = descriptor.value;
  // eslint-disable-next-line no-param-reassign
  descriptor.value = function () {
    const { INCENTIVES_CONTROLLER, INCENTIVES_CONTROLLER_REWARD_TOKEN } =
      this.incentivesConfig || {};

    if (
      !utils.isAddress(INCENTIVES_CONTROLLER_REWARD_TOKEN) ||
      !utils.isAddress(INCENTIVES_CONTROLLER)
    ) {
      console.error(`[IncentivesValidator] You need to pass valid addresses`);
      return [];
    }

    isEthAddressValidator(target, propertyName, arguments);

    // isEthAddressArrayValidator(target, propertyName, arguments);

    return method?.apply(this, arguments);
  };
}

export function FaucetValidator(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<any>
): any {
  const method = descriptor.value;
  // eslint-disable-next-line no-param-reassign
  descriptor.value = function () {
    const FAUCET = this.faucetConfig?.FAUCET;

    if (!FAUCET || (FAUCET && !utils.isAddress(FAUCET))) {
      console.error(`[FaucetValidator] You need to pass valid addresses`);
      return [];
    }

    const isParamOptional = optionalValidator(target, propertyName, arguments);

    isEthAddressValidator(target, propertyName, arguments, isParamOptional);

    amountGtThan0Validator(target, propertyName, arguments, isParamOptional);

    return method?.apply(this, arguments);
  };
}

export function WETHValidator(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<any>
): any {
  const method = descriptor.value;
  // eslint-disable-next-line no-param-reassign
  descriptor.value = function () {
    const WETH_GATEWAY = this.wethGatewayConfig?.WETH_GATEWAY || '';

    if (!utils.isAddress(WETH_GATEWAY)) {
      console.error(`[WethGatewayValidator] You need to pass valid addresses`);
      return [];
    }

    isEthAddressValidator(target, propertyName, arguments);

    amountGtThan0Validator(target, propertyName, arguments);

    amountGtThan0OrMinus1(target, propertyName, arguments);

    return method?.apply(this, arguments);
  };
}

export function PunkValidator(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<any>
): any {
  const method = descriptor.value;
  // eslint-disable-next-line no-param-reassign
  descriptor.value = function () {
    const PUNK_GATEWAY = this.punkGatewayConfig?.PUNK_GATEWAY || '';

    if (!utils.isAddress(PUNK_GATEWAY)) {
      console.error(`[PunkGatewayValidator] You need to pass valid addresses`);
      return [];
    }

    isEthAddressValidator(target, propertyName, arguments);

    amountGtThan0Validator(target, propertyName, arguments);

    amountGtThan0OrMinus1(target, propertyName, arguments);

    return method?.apply(this, arguments);
  };
}
