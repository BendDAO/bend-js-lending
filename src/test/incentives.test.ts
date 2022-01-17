import { formatUserSummaryData } from '../v1/formatting';
import {
  mockLoan,
  mockNft,
  mockReserve,
  mockUserId,
  mockUserIncentive,
  mockUserNft,
  mockUserReserve,
} from './mock-data';

describe('calculateUserReserveIncentives', () => {
  const formattedUserReserve = formatUserSummaryData(
    [mockReserve],
    [mockUserReserve],
    [mockNft],
    [mockUserNft],
    [mockLoan],
    [mockUserIncentive],
    mockUserId,
    '0',
    1631587561
  );

  it('should calculate the correct bWETH incentives', () => {
    expect(formattedUserReserve.totalRewards).toBe('1545.269812517967062645');
  });
});
