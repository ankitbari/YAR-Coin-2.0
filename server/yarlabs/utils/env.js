require('dotenv').config();

module.exports = {
    PORT: process.env.PORT,
    YAR_RATE: process.env.YAR_RATE,
    ADMIN_REWARD_RATE: process.env.ADMIN_REWARD_RATE,
    MONGO_URI: process.env.MONGO_URI,
    SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
    ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
    YAR_CONTRACT_ADDRESS: process.env.YAR_CONTRACT_ADDRESS,
    NFT_CONTRACT_ADDRESS: process.env.NFT_CONTRACT_ADDRESS,
    DEX_CONTRACT_ADDRESS: process.env.DEX_CONTRACT_ADDRESS,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN
};