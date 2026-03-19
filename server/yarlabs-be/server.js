require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const helmet = require('helmet');
const http = require('http');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const { ethers } = require('ethers');

const connectDB = require('./utils/connectDB');
const chatSocket = require('./sockets/chatSocket');
const login = require('./routes/loginRoutes');
const members = require('./routes/studentRoutes');
const Student = require('./models/Member');
const teacherRoutes = require('./routes/teacherRoutes');
const Teacher = require('./models/Teacher');
const biddingRoutes = require('./routes/biddingRoutes');
const Bidding = require('./models/Bidding')
const dexRoutes = require('./routes/dexRoutes');
const statRoutes = require('./routes/statRoutes');
const paneltyRoutes = require('./routes/paneltyRoutes');
const nftRoutes = require('./routes/nftRoutes');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: "Too many requests, try again later...!" }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ success: true, message: "Welcome to YAR Labs...!" })
});

app.use('/api/v1/auth', login);
app.use('/api/v1/members', members);
app.use('/api/teachers', teacherRoutes);
app.use('/api/biddings', biddingRoutes);
app.use('/stat', statRoutes);
app.use('/apply', paneltyRoutes);
app.use('/mint', nftRoutes);
app.use('/dex', dexRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route invalid...!", error: "INVALID_ROUTE" });
});

connectDB();

const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

chatSocket(io);

// cron.schedule('* * * * *', async () => {
//     console.log("Running auction settlements...");
//     const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
//     const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
//     const contractAddress = process.env.YAR_CONTRACT_ADDRESS;
//     const abi = ["function transferFrom(address from, address to, uint256 value) public returns (bool)",
//         "function allowance(address owner, address spender) view returns (uint256)",
//         "function balanceOf(address owner) view returns (uint256)"];
//     const contract = new ethers.Contract(contractAddress, abi, wallet);
//     const students = await Student.find({ ownedBy: null });
//     for (let student of students) {
//         const lastBid = await Bidding.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(1);
//         if (!lastBid.length) continue;
//         const auctionEnd = 1 * 60 * 1000; // 3 * 24 * 60 * 60 * 1000
//         if (new Date() - lastBid[0].createdAt >= auctionEnd) {
//             const highestBid = await Bidding.find({ studentId: student._id }).sort({ bidAmount: -1 }).limit(1);
//             if (!highestBid.length) continue;
//             const bidAmount = highestBid[0].bidAmount;
//             const teacher = await Teacher.findById(highestBid[0].teacherId);
//             if (!teacher) continue;
//             if (!student.walletAddress || !teacher.walletAddress) {
//                 console.log("Wallet missing!");
//                 continue;
//             }
//             if (teacher.purse < bidAmount) {
//                 console.log("Admin has insufficient purse!");
//                 continue;
//             }
//             try {
//                 const amount = ethers.parseUnits(bidAmount.toString(), 18);
//                 const allowance = await contract.allowance(teacher.walletAddress, wallet.address);
//                 if (allowance < amount) {
//                     console.log("Admin has not enough approved YARs!");
//                     continue;
//                 }
//                 const balance = await contract.balanceOf(teacher.walletAddress);
//                 if (balance < amount) {
//                     console.log("Admin has insufficient YAR balance!");
//                     continue;
//                 }
//                 const tx = await contract.transferFrom(teacher.walletAddress, student.walletAddress, amount);
//                 await tx.wait();
//                 student.ownedBy = teacher._id;
//                 student.yarBalance += bidAmount;
//                 teacher.purse -= bidAmount;
//                 await teacher.save();
//                 await student.save();
//                 console.log("Auction settled successfully!");
//             } catch (err) {
//                 console.log(`Blockchain transfer failed and ${err.message}`);
//             }
//         }
//     }
//     console.log("Finished auction settlements...");
// });

app.use((err, req, res, next) => {
    console.error("ERROR:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        error: err.code || "SERVER_ERROR"
    });
});

server.listen(5555, () => {
    console.log(`Server port : 5555`)
});