import { ReserveData } from '../v1/types';
import { formatReserves, formatUserSummaryData } from '../v1/formatting';
import BigNumber from 'bignumber.js';
import {
  mockReserve,
  mockUserReserve,
  mockNft,
  mockUserNft,
  mockUserIncentive,
  mockLoan,
  mockUserId,
} from './mock-data';

describe('computations and formattings', () => {
  describe('formatUserSummaryData', () => {
    const formattedMockReserve = formatUserSummaryData(
      [mockReserve],
      [mockUserReserve],
      [mockNft],
      [mockUserNft],
      [mockLoan],
      [mockUserIncentive],
      mockUserId,
      '598881655557838',
      mockUserReserve.reserve.lastUpdateTimestamp + 2000
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
