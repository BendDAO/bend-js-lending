import { ReserveData, NftData, LoanData } from '../v1/types';
import { formatReserves, formatNfts, formatLoans, formatUserSummaryData } from '../v1/formatting';
import BigNumber from 'bignumber.js';
import {
  mockReserve,
  mockUserReserve,
  mockNft,
  mockUserNft,
  mockUserIncentive,
  mockLoan,
  mockUserId,
  mockUsdPrice,
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
      mockUsdPrice,
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

  describe('formatNfts', () => {
    it('should return plausible results', () => {
      const formattedMockNft = formatNfts(
        [mockNft],
        mockReserve.lastUpdateTimestamp + 2000
      )[0];
      expect(formattedMockNft).toMatchSnapshot();
    });

    it('should allow omitting timestamp', () => {
      const formattedMockNft = formatNfts([mockNft])[0];
      expect(formattedMockNft).toMatchSnapshot();
    });

    it('should return proper values for new nfts', () => {
      const newNft: Partial<NftData> = {
        totalCollateral: '7',
        redeemFine: '2345',
      };
      const formattedMockNft = formatNfts(
        [
          {
            ...mockNft,
            ...newNft,
          },
        ],
        mockNft.lastUpdateTimestamp
      )[0];
      expect(formattedMockNft.totalCollateral).toBe('7');
    });
  });

  describe('formatLoans', () => {
    it('should return plausible results', () => {
      const formattedMockLoan = formatLoans(
        [mockReserve],
        [mockNft],
        [mockLoan],
        mockUsdPrice,
        mockLoan.lastUpdateTimestamp + 2000
      )[0];
      expect(formattedMockLoan).toMatchSnapshot();
    });

    it('should allow omitting timestamp', () => {
      const formattedMockLoan = formatLoans([mockReserve],[mockNft],[mockLoan], mockUsdPrice)[0];
      expect(formattedMockLoan).toMatchSnapshot();
    });

    it('should return proper values for new nfts', () => {
      const newLoan: Partial<LoanData> = {
        nftTokenId: '12345',
        currentAmount: '11223344556677889900',
      };
      const formattedMockLoan = formatLoans(
        [mockReserve],
        [mockNft],
        [
          {
            ...mockLoan,
            ...newLoan,
          },
        ],
        mockUsdPrice,
        mockReserve.lastUpdateTimestamp
      )[0];
      expect(formattedMockLoan.nftTokenId).toBe('12345');
    });

    it('should increase over time', () => {
      /**
       * tests against a regression which switched two dates
       */
      const first = formatLoans(
        [mockReserve],
        [mockNft],
        [mockLoan],
        mockUsdPrice,
        mockLoan.lastUpdateTimestamp + 1,
      )[0];
      const second = formatLoans(
        [mockReserve],
        [mockNft],
        [mockLoan],
        mockUsdPrice,
        mockLoan.lastUpdateTimestamp + 2
      )[0];

      expect(new BigNumber(second.currentAmount).gte(first.currentAmount)).toBe(true);
    });
  });
});
