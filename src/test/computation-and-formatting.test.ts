import { ReserveData, UserReserveData, NftData, UserNftData, LoanData, UserIncentive } from '../v1/types';
import {
  formatReserves,
  formatUserSummaryData,
} from '..//v1/computations-and-formatting';
import BigNumber from 'bignumber.js';

const mockReserve: ReserveData = {
  underlyingAsset: '0xff795577d9ac8bd7d90ee22b6c1703490b6512fd',
  name: '',
  symbol: 'DAI',
  decimals: 18,
  reserveFactor: '1000',
  borrowingEnabled: true,
  isActive: true,
  isFrozen: false,
  liquidityIndex: '1000164447379610590574518134',
  variableBorrowIndex: '1000232854433711209646283880',
  liquidityRate: '26776200735312093055313462',
  variableBorrowRate: '38568743388028395681971229',
  lastUpdateTimestamp: 1606992400,
  bTokenAddress: '0xdCf0aF9e59C002FA3AA091a46196b37530FD48a8',
  debtTokenAddress: '0xEAbBDBe7aaD7d5A278da40967E62C8c8Fe5fAec8',
  // interestRateStrategyAddress: '0x1c4c4dD7F19738Fd7C21Fa7CbF9667710ff3Ba4c',
  availableLiquidity: '43133641118657852003256',
  totalScaledVariableDebt: '145496831599325217573288',
  // priceInEth: '1634050000000000',
  variableRateSlope1: '40000000000000000000000000',
  variableRateSlope2: '750000000000000000000000000',
  id: '0xff795577d9ac8bd7d90ee22b6c1703490b6512fd0x88757f2f99175387ab4c6a4b3067c77a695b0349',
  price: { priceInEth: '1634050000000000' },
  // fake data
  optimalUtilisationRate: '109284236984257451326752610',
  baseVariableBorrowRate: '109284236984257451326752610',
};

const mockUserReserve: UserReserveData = {
  // underlyingAsset: '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD',
  scaledBTokenBalance: '0',
  scaledVariableDebt: '137602026075945229933190',
  variableBorrowIndex: '0',
  //id:0cd96fb5ee9616f64d892644f53f35be4f90xff795577d9ac8bd7d90ee22b6c1703490b6512fd0x88757f2f99175387ab4c6a4b3067c77a695b0349',
  reserve: {
    id: '0xff795577d9ac8bd7d90ee22b6c1703490b6512fd0x88757f2f99175387ab4c6a4b3067c77a695b0349',
    underlyingAsset: '0xff795577d9ac8bd7d90ee22b6c1703490b6512fd',
    name: '',
    symbol: 'DAI',
    decimals: 18,
    lastUpdateTimestamp: 1607000068,
  },
};

const mockNft: NftData = {};

const mockUserNft: UserNftData = {};

const mockLoan: LoanData = {};

const mockUserIncentive: UserIncentive = {};

describe('computations and formattings', () => {
  describe('formatUserSummaryData', () => {
    const formattedMockReserve = formatUserSummaryData(
      [mockReserve],
      [mockUserReserve],
      [mockNft],
      [mockUserNft],
      [mockLoan],
      [mockUserIncentive],
      '0cd96fb5ee9616f64d892644f53f35be4f90xff795577d9ac8bd7d90ee22b6c1703490b6512fd0x88757f2f99175387ab4c6a4b3067c77a695b0349',
      '598881655557838',
      mockUserReserve.reserve.lastUpdateTimestamp + 2000,
    );
    expect(formattedMockReserve).toMatchSnapshot();
  });

  describe('formatReserves', () => {
    it('should return plausible results', () => {
      const formattedMockReserve = formatReserves(
        [mockReserve],
        mockReserve.lastUpdateTimestamp + 2000
      )[0];
      expect(formattedMockReserve).toMatchSnapshot();
    });

    it('should allow omitting timestamp', () => {
      const formattedMockReserve = formatReserves([mockReserve])[0];
      expect(formattedMockReserve).toMatchSnapshot();
    });

    /**
     * Whenever we add a new asset there#s a chance that an asset has no paramsHistory from 30days ago
     * We should not throw if that's the case, but just ignore it
     */
    it("should not error When 30dago reserves doesn't contain paramsHistory", () => {
      formatReserves([mockReserve], mockReserve.lastUpdateTimestamp + 2000, [
        mockReserve as any,
      ]);
      formatReserves([mockReserve], mockReserve.lastUpdateTimestamp + 2000, [
        { ...mockReserve, paramsHistory: [] } as any,
      ]);
      // would be wrong if any of the above threw
      expect(true).toBe(true);
    });

    it('should return proper values for new reserves', () => {
      const newReserve: Partial<ReserveData> = {
        availableLiquidity: '0',
        totalScaledVariableDebt: '0',
      };
      const formattedMockReserve = formatReserves(
        [
          {
            ...mockReserve,
            ...newReserve,
          },
        ],
        mockReserve.lastUpdateTimestamp
      )[0];
      expect(formattedMockReserve.utilizationRate).toBe('0');
    });

    it('should increase over time', () => {
      /**
       * tests against a regression which switched two dates
       */
      const first = formatReserves(
        [mockReserve],
        mockReserve.lastUpdateTimestamp + 1,
        [mockReserve as any]
      )[0];
      const second = formatReserves(
        [mockReserve],
        mockReserve.lastUpdateTimestamp + 2,
        [mockReserve as any]
      )[0];

      expect(new BigNumber(second.totalDebt).gte(first.totalDebt)).toBe(true);
    });
  });
});
