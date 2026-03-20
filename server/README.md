# YAR-Coin-2.0 Official Server Endpoints :

- Login API
```bash
POST   https://yarcoin.vercel.app/api/v1/auth/login
```

- Socket Chat Tunnel
```bash
wss://yarcoin.vercel.app
```

- Auction Settlement Cron Job
```bash
* * * * *
```

- Admin API's
```bash
GET    https://yarcoin.vercel.app/api/v1/admins
POST   https://yarcoin.vercel.app/api/v1/admins
GET    https://yarcoin.vercel.app/api/v1/stats/repo/:owner/:repo
GET    https://yarcoin.vercel.app/api/v1/apply/panelty/:walletAddress
POST   https://yarcoin.vercel.app/api/v1/apply/panelty
GET    https://yarcoin.vercel.app/api/v1/mint/nft/:walletAddress
POST   https://yarcoin.vercel.app/api/v1/mint/nft
```

- Members API's
```bash
GET    https://yarcoin.vercel.app/api/v1/members
POST   https://yarcoin.vercel.app/api/v1/members
GET    https://yarcoin.vercel.app/api/v1/dex/transactions/:walletAddress
POST   https://yarcoin.vercel.app/api/v1/dex/convert
```

- Bidding API's
```bash
GET    https://yarcoin.vercel.app/api/v1/bids/member/:memberId
POST   https://yarcoin.vercel.app/api/v1/bids/admin
```