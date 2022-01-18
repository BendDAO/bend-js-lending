# BEND-JS

BEND is a decentralized non-custodial NFT liquidity and Lending market protocol where users can participate as depositors or borrowers. The BEND Protocol is a set of open source smart contracts which facilitate the lending and borrowing of user funds. These contracts, and all user transactions/balances are stored on a public ledger called a blockchain, making them accessible to anyone.

The bend-js package gives developers access to methods for formatting data and executing transactions on the BEND protocol.

1. [Quick Start](#quick-start)
2. [Data Formatting Methods](#data-formatting-methods)
   - a. [User Data](#user-data)
      - [formatUserSummaryData](#formatUserSummaryData)
   - b. [Reserve Data](#reserve-data)
      - [formatReserves](#formatReserves)
   - c. [NFT Data](#nft-data)
      - [formatNfts](#formatNfts)
   - d. [Loan Data](#loan-data)
      - [formatLoans](#formatLoans)
3. [Transaction Methods](#transaction-methods)
   - a. [Lend Pool](#lend-pool)
      - [deposit](#deposit)
      - [borrow](#borrow)
      - [repay](#repay)
      - [withdraw](#withdraw)
      - [auction](#aucton)
      - [redeem](#redeem)
      - [liquidate](#liquidate)
   - b. [claimRewards](#claimRewards)
4. [Lint](#lint)
5. [Build](#build)


# Quick Start

This package uses [ethers v5](https://github.com/ethers-io/ethers.js#readme) as peer dependency, so make sure you have installed it in your project.

```bash
npm install --save ethers
```

## Installing

```bash
npm install --save @bend/bend-js
```

# Data Formatting Methods

BEND aggregates on-chain protocol data into a variety of different subgraphs on TheGraph which can be queried directly using the playground (links below) and integrated into applications directly via TheGraph API.

The bend-js data formatting methods are a layer beyond graphql which wraps protocol data into more usable formats. Each method will require inputs from BEND subgraph queries, links to these queries in the source code are provided for each method below.

Check out this [getting started](https://docs.benddao.xyz/developers/getting-started/using-graphql) guide to get your application integrated with the BEND subgraphs.

- GraphQL (Main Market)
	- Playground: https://thegraph.com/explorer/subgraph/bend/bend-protocol
	- API: https://api.thegraph.com/subgraphs/name/bend/bend-protocol

The Subgraph contains data for main markets. The market which a reserve belongs to can be identified with the pool parameter (market address). The pool id for available markets are below:

- Main Market: "0x"

## Sample Usage

```js
import { bend } from '@bend/bend-js';

// Fetch poolReservesData from GQL Subscription
// Fetch rawUserReserves from GQL Subscription
// Fetch ethPriceUSD from GQL Subscription

let userAddress = "0x..."

let userSummary = bend.formatUserSummaryData(poolReservesData, rawUserReserves, userAddress.toLowerCase(), Math.floor(Date.now() / 1000))

```

## User Data

### formatUserSummaryData

Returns formatted summary of BEND user portfolio including: array of holdings, total liquidity, total collateral, total borrows, liquidation threshold, health factor, and available borrowing power

- @param `poolReservesData` GraphQL input:
	- subscription: src/[v1 or v2]/graphql/subscriptions/reserves-update-subscription.graphql
      : Requires input of pool (address of market which can be found above, or remove this filter to fetch all markets)
	- types: src/[v1 or v2]/graphql/fragments/pool-reserve-data.graphql
- @param `rawUserReserves` GraphQL input, query can be found here:
   - subscription: src/[v1 or v2]/graphql/subscriptions/user-position-update-subscription.graphql
      : Requires input of user (lowercase address), and pool (address of market which can be found above, or remove this filter to fetch all markets)
   - types: src/[v1 or v2]/graphql/fragments/user-reserve-data.graphql
- @param `userId` Wallet address, MUST BE LOWERCASE!
- @param `usdPriceEth` Current price of USD in ETH in small units (10^18). For example, if ETH price in USD = $1900, usdPriceEth = (1 / 1900) * 10^18
   : Can also be fetched using this subscription: /src/[v1 or v2]/graphql/subscriptions/usd-price-eth-update-subscription.graphql
- @param `currentTimestamp` Current Unix timestamp in seconds: Math.floor(Date.now() / 1000)
- @param @optional `rewardsInfo` Information used to compute bTokenRewards (deposit rewards), debtTokenRewards (debt rewards). Object with format:
  ```
  {
    rewardTokenAddress: string;
    rewardTokenDecimals: number;
    incentivePrecision: number;
    rewardTokenPriceEth: string;
    emissionEndTimestamp: number;
  }
  ```
  All fields can be fetched from the IncentivesController subgraph entity with the exception of rewardTokenPriceEth. Since reward tokens are not guaranteed to be Bend reserve tokens, the price feed for reward tokens is not directly attached to the controller.

```
v1.formatUserSummaryData(
  poolReservesData: ReserveData[],
  rawUserReserves: UserReserveData[],
  userId: string,
  usdPriceEth: BigNumberValue,
  currentTimestamp: number,
  rewardsInfo?: RewardInformation
);
```

## Reserve Data

### formatReserves

Returns formatted summary of each BEND reserve asset

Note: liquidityRate = deposit rate in the return object

- @param `reserves` GraphQL input:
	- subscription: src/[v1 or v2]/graphql/subscriptions/reserves-update-subscription.graphql
      : Requires input of pool (address of market which can be found above, or remove this filter to fetch all markets)
	- types: src/[v1 or v2]/graphql/fragments/pool-reserve-data.graphql
- @param @optional `reservesIndexed30DaysAgo` GraphQL input:
   - subscription: src/[v1 or v2]/graphql/subscriptions/reserve-rates-30-days-ago.graphql
   - types: src/[v1 or v2]/graphql/fragments/reserve-rates-history-data.graphql
- @param @optional `currentTimestamp` Current Unix timestamp in seconds: Math.floor(Date.now() / 1000)
- @param @optional `emissionEndTimestamp` Timestamp of reward emission end. Can be fetched from IncentivesController subgraph entity

```
v1.formatReserves(
	reserves: ReserveData[]
	reservesIndexed30DaysAgo?: ReserveRatesData[],
  currentTimestamp?: number,
  rewardTokenPriceEth?: string,
  emissionEndTimestamp?: number
);
```

# Transaction Methods

## Markets and Networks

The library exports the enabled networks and markets in the Bend protocol as the enums `Network` and `Market`

```
import { Network, Market } from '@bend/bend-js';
```

## Usage

```
import { TxBuilder, Network, Market } from '@bend/bend-js'

const httpProvider = new Web3.providers.HttpProvider(
    process.env.ETHEREUM_URL ||
      "https://rinkeby.infura.io/v3/<project_id>"
  );
const txBuilder = new TxBuilder(Network.main, httpProvider);

lendingPool = txBuilder.getLendingPool(Market.main); // get all lending pool methods
```

## Providers

The library accepts 3 kinds of providers:

- web3 provider
- JsonRPC url
- no provider: if no provider is passed it will default to ethers Infura / etherscan providers (shared providers, do not use in production)

To learn more about supported providers, see the [ethers documentation on providers](https://docs.ethers.io/v5/api/providers/#providers).

## Lend Pool

Object that contains all the necessary methods to create Bend lending pool transactions.

The return object will be a Promise array of objects of type:

```
import { EthereumTransactionTypeExtended } from '@bend/bend-js'
```

having {tx, txType}

- tx: object with transaction fields.
- txType: string determining the kinds of transaction.

### deposit

Deposits the underlying asset into the reserve. A corresponding amount of the overlying asset (bTokens) is minted.

- @param `user` The ethereum address that will make the deposit
- @param `reserve` The ethereum address of the reserve
- @param `amount` The amount to be deposited
- @param @optional `onBehalfOf` The ethereum address for which user is depositing. It will default to the user address
- @param @optional `referralCode` Integrators are assigned a referral code and can potentially receive rewards. It defaults to 0 (no referrer)

```
lendingPool.deposit({
   user, // string,
   reserve, // string,
   amount, // string,
   onBehalfOf, // ? string,
   referralCode, // ? string,
});
```

If the `user` is not approved, an approval transaction will also be returned.

### withdraw

Withdraws the underlying asset of an bToken asset.

- @param `user` The ethereum address that will receive the bTokens
- @param `reserve` The ethereum address of the reserve asset
- @param `amount` The amount of bToken being redeemed
- @param @optional `bTokenAddress` The ethereum address of the bToken. Only needed if the reserve is ETH mock address
- @param @optional `onBehalfOf` The amount of bToken being redeemed. It will default to the user address

```
lendingPool.withdraw({
   user, // string,
   reserve, // string,
   amount, // string,
   bTokenAddress, // ? string,
   onBehalfOf, // ? string
});
```

### borrow

Borrow an `amount` of `reserve` asset.

User must have a collaterised position (i.e. bTokens in their wallet)

- @param `user` The ethereum address that will receive the borrowed amount
- @param `reserve` The ethereum address of the reserve asset
- @param `amount` The amount to be borrowed, in human readable units (e.g. 2.5 ETH)
- @param @optional `debtTokenAddress` The ethereum address of the debt token of the asset you want to borrow. Only needed if the reserve is ETH mock address
- @param @optional `onBehalfOf` The ethereum address for which user is borrowing. It will default to the user address
- @param @optional `refferalCode` Integrators are assigned a referral code and can potentially receive rewards. It defaults to 0 (no referrer)

```
lendingPool.borrow({
   user, // string,
   reserve, // string,
   amount, // string,
   interestRateMode, // InterestRate;
   debtTokenAddress, // ? string;
   onBehalfOf, // ? string;
   referralCode, // ? string;
});
```

### repay

Repays a borrow on the specific reserve, for the specified amount (or for the whole amount, if (-1) is specified).
the target user is defined by `onBehalfOf`. If there is no repayment on behalf of another account, `onBehalfOf` must be equal to `user`.

- @param `user` The ethereum address that repays
- @param `reserve` The ethereum address of the reserve on which the user borrowed
- @param `amount` The amount to repay, or (-1) if the user wants to repay everything
- @param @optional `onBehalfOf` The ethereum address for which user is repaying. It will default to the user address

```
lendingPool.repay({
   user, // string,
   reserve, // string,
   amount, // string,
   interestRateMode, // InterestRate;
   onBehalfOf, // ? string
});
```

If the `user` is not approved, an approval transaction will also be returned.

### liquidate

Users can invoke this function to liquidate an undercollateralized position.

- @param `liquidator` The ethereum address that will liquidate the position
- @param `liquidatedUser` The address of the borrower
- @param `debtReserve` The ethereum address of the principal reserve
- @param `collateralReserve` The address of the collateral to liquidated
- @param `purchaseAmount` The amount of principal that the liquidator wants to repay
- @param @optional `getBToken` Boolean to indicate if the user wants to receive the bToken instead of the asset. Defaults to false

```
lendingPool.liquidate({
  liquidator, // string;
  liquidatedUser, // string;
  debtReserve, // string;
  collateralReserve, // string;
  purchaseAmount, // string;
  getbToken, // ? boolean;
});
```

## Lint

To lint we use EsLint with typescript plugins and extending Airbnb

```
npm run lint
```

## Build

To build run:

```
npm run build // builds with tsdx
npm run build:tsc // builds with tsc
```
