// import BigNumber from 'bignumber.js';
import { formatUserSummaryData } from '../v1';

describe('calculateUserReserveIncentives', () => {
  const reserveData = {
    id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
    underlyingAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    symbol: 'bWETH',
    decimals: 18,
    baseLTVasCollateral: '8000',
    reserveLiquidationThreshold: '8500',
    reserveLiquidationBonus: '10500',
    reserveFactor: '1000',
    usageAsCollateralEnabled: true,
    borrowingEnabled: true,
    isActive: true,
    liquidityIndex: '1007431539067282236768346040',
    variableBorrowIndex: '1009130500436609696185241835',
    liquidityRate: '222438954027153387451224',
    variableBorrowRate: '5352853290785089356838046',
    lastUpdateTimestamp: 1631587511,
    bTokenAddress: '0x030ba81f1c18d280636f32af80b9aad02cf0854e',
    debtTokenAddress: '0xf63b34710400cad3e044cffdcab00a0f32e33ecf',
    interestRateStrategyAddress: '0x4ce076b9dd956196b814e54e1714338f18fde3f4',
    availableLiquidity: '1827977661703998535260749',
    totalScaledVariableDebt: '81689984341288838884434',

    price: { priceInEth: '1000000000000000000' },
    priceInEth: '1000000000000000000',
    variableRateSlope1: '80000000000000000000000000',
    variableRateSlope2: '1000000000000000000000000000',
    aEmissionPerSecond: '1979166666666666',
    vEmissionPerSecond: '104166666666666',
    sEmissionPerSecond: '0',
    aIncentivesLastUpdateTimestamp: 1631587511,
    vIncentivesLastUpdateTimestamp: 1631587387,
    sIncentivesLastUpdateTimestamp: 0,
    bTokenIncentivesIndex: '24733519699535219',
    vTokenIncentivesIndex: '26465727412280876',
    sTokenIncentivesIndex: '0',
  };
  const rawUserReserve = {
    userReserve: {
      scaledBTokenBalance: '99353924118371338',
      usageAsCollateralEnabledOnUser: true,
      scaledVariableDebt: '0',
      variableBorrowIndex: '0',
      bTokenincentivesUserIndex: '0',
      vTokenincentivesUserIndex: '24934844000963410',
      sTokenincentivesUserIndex: '0',
      reserve: {
        id: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
        symbol: 'ETH',
        decimals: 18,
        liquidityRate: '222438954027153387451224',
        reserveLiquidationBonus: '10500',
        lastUpdateTimestamp: 1631587511,
        price: {
          priceInEth: '1000000000000000000',
        },
        reserveFactor: '1000',
        baseLTVasCollateral: '8000',
        liquidityIndex: '1007431539067282236768346040',
        reserveLiquidationThreshold: '8250',
        variableBorrowIndex: '1009130500436609696185241835',
        variableBorrowRate: '5352853290785089356838046',
        availableLiquidity: '1827977661703998535260749',
        totalScaledVariableDebt: '81689984341288838884434',
        usageAsCollateralEnabled: true,
      },
    },
    currentTimestamp: 1631587561,
    usdPriceEth: 329302000000,
  };

  const formattedUserReserve = formatUserSummaryData(
    [reserveData as any],
    [rawUserReserve.userReserve as any],
    [],
    [],
    [],
    [],
    '0x0',
    '0',
    1631587561
  );

  it('should calculate the correct bWETH incentives', () => {
    expect(formattedUserReserve.totalRewards).toBe('0.002457377422282363');
  });
});
