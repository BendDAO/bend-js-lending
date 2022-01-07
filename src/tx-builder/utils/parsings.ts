import BigNumber from 'bignumber.js';
import { API_ETH_MOCK_ADDRESS, DEFAULT_NULL_VALUE_ON_TX } from '../config';
import { tStringDecimalUnits } from '../types';

export const parseNumber = (value: string, decimals: number): string => {
  return new BigNumber(value)
    .multipliedBy(new BigNumber(10).pow(decimals))
    .toFixed(0);
};

export const decimalsToCurrencyUnits = (
  value: string,
  decimals: number
): string =>
  new BigNumber(value).div(new BigNumber(10).pow(decimals)).toFixed();

export const getTxValue = (reserve: string, amount: string): string => {
  return reserve.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase()
    ? amount
    : DEFAULT_NULL_VALUE_ON_TX;
};

export const mintAmountsPerToken: { [token: string]: tStringDecimalUnits } = {
  BUSD: parseNumber('10000', 18),
  DAI: parseNumber('10000', 18),
  WETH: parseNumber('10', 18),
  USDC: parseNumber('10000', 6),
  USDT: parseNumber('10000', 6),
};

export const canBeEnsAddress = (ensAddress: string): boolean => {
  return ensAddress.toLowerCase().endsWith('.eth');
};
