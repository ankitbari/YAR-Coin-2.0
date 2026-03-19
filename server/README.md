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
POST   https://yarcoin.vercel.app/api/teachers
GET    https://yarcoin.vercel.app/api/teachers
GET    https://yarcoin.vercel.app/stat/repo/:owner/:repo
POST   https://yarcoin.vercel.app/apply/panelty
GET    https://yarcoin.vercel.app/apply/panelty/:walletAddress
POST   https://yarcoin.vercel.app/mint/nft
GET    https://yarcoin.vercel.app/mint/nft/:walletAddress
```

- Members API's
```bash
GET    https://yarcoin.vercel.app/api/v1/members
POST   https://yarcoin.vercel.app/api/v1/members
POST   https://yarcoin.vercel.app/convert
GET    https://yarcoin.vercel.app/transactions/:walletAddress
```

- Bidding API's
```bash
POST   https://yarcoin.vercel.app/api/biddings
GET    https://yarcoin.vercel.app/api/biddings/student/:studentId
```