const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const cron = require('node-cron');
const http = require('http');
const helmet = require('helmet');
const { Server } = require('socket.io');
// const dotenv = require('dotenv');
// dotenv.config();
const { PORT, SEPOLIA_RPC_URL, ADMIN_PRIVATE_KEY, YAR_CONTRACT_ADDRESS, MONGO_URI } = require('./utils/env');
const studentRoutes = require('./routes/studentRoutes');
const Student = require('./models/Student');
const teacherRoutes = require('./routes/teacherRoutes');
const Teacher = require('./models/Teacher');
const biddingRoutes = require('./routes/biddingRoutes');
const Bidding = require('./models/Bidding')
const DEXRoutes = require('./routes/DEXRoutes');
const Message = require('./models/Message');
const statRoutes = require('./routes/statRoutes');
const paneltyRoutes = require('./routes/paneltyRoutes');
const nftRoutes = require('./routes/nftRoutes');
const { ethers } = require('ethers');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ success: true, message: "Welcome to YAR Labs...!" })
});

app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/biddings', biddingRoutes);
app.use('/stat', statRoutes);
app.use('/apply', paneltyRoutes);
app.use('/mint', nftRoutes);
app.use('/dex', DEXRoutes);

// app.use((req, res) => {
//     res.status(404).json({ success: false, message: "Route invalid...!", error: "INVALID_ROUTE" });
// });

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected...!'))
    .catch((err) => console.log(err));

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.post('/login', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            return res.status(400).json({ error: 'WalletAddres are required!' });
        }
        const student = await Student.findOne({ walletAddress });
        if (student) {
            return res.status(200).json({ message: 'Login successful...', role: 'student', user: student });
        }
        const teacher = await Teacher.findOne({ walletAddress });
        if (teacher) {
            return res.status(200).json({ message: 'Login successful...', role: 'teacher', user: teacher });
        }
        return res.status(400).json({ error: 'Invalid credentials!' });
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

io.on("connection", (socket) => {
    // console.log("User connected:", socket.id);
    socket.on("joinRoom", async ({ userId, role }) => {
        try {
            let adminId;

            if (role === "admin") {
                adminId = userId;
            } else {
                const student = await Student.findById(userId);
                if (!student || !student.ownedBy) return;

                adminId = student.ownedBy;
            }

            const roomId = `admin_${adminId}`;

            socket.join(roomId);

            const previousMessages = await Message
                .find({ roomId })
                .sort({ timestamp: 1 });

            socket.emit("previousMessages", previousMessages);

        } catch (error) {
            console.log(error);
        }
    });

    socket.on("sendMessage", async ({ userId, role, message }) => {
        try {
            let adminId;

            if (role === "admin") {
                adminId = userId;
            } else {
                const student = await Student.findById(userId);
                if (!student || !student.ownedBy) return;

                adminId = student.ownedBy;
            }

            const roomId = `admin_${adminId}`;

            const newMessage = await Message.create({
                roomId,
                senderId: userId,
                senderRole: role,
                message
            });

            io.to(roomId).emit("receiveMessage", newMessage);

        } catch (error) {
            console.log(error);
        }
    });

    socket.on("disconnect", () => {
        // console.log("User disconnected:", socket.id);
    });

});

app.post('/auction', async (req, res) => {
    // cron.schedule('* * * * *', async () => {
    console.log("Running auction settlements...");
    try {
        const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
        const contractAddress = YAR_CONTRACT_ADDRESS;
        const abi = ["function transferFrom(address from, address to, uint256 value) public returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address owner) view returns (uint256)"];
        const contract = new ethers.Contract(contractAddress, abi, wallet);
        const students = await Student.find({ ownedBy: null });
        for (let student of students) {
            const lastBid = await Bidding.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(1);
            if (!lastBid.length) continue;
            const auctionEnd = 1 * 60 * 1000; // 3 * 24 * 60 * 60 * 1000
            if (new Date() - lastBid[0].createdAt >= auctionEnd) {
                const highestBid = await Bidding.find({ studentId: student._id }).sort({ bidAmount: -1 }).limit(1);
                if (!highestBid.length) continue;
                const bidAmount = highestBid[0].bidAmount;
                const teacher = await Teacher.findById(highestBid[0].teacherId);
                if (!teacher) continue;
                if (!student.walletAddress || !teacher.walletAddress) {
                    console.log("Wallet missing!");
                    continue;
                }
                if (teacher.purse < bidAmount) {
                    console.log("Admin has insufficient purse!");
                    continue;
                }
                try {
                    const amount = ethers.parseUnits(bidAmount.toString(), 18);
                    const allowance = await contract.allowance(teacher.walletAddress, wallet.address);
                    if (allowance < amount) {
                        console.log("Admin has not enough approved YARs!");
                        continue;
                    }
                    const balance = await contract.balanceOf(teacher.walletAddress);
                    if (balance < amount) {
                        console.log("Admin has insufficient YAR balance!");
                        continue;
                    }
                    const tx = await contract.transferFrom(teacher.walletAddress, student.walletAddress, amount);
                    await tx.wait();
                    student.ownedBy = teacher._id;
                    student.yarBalance += bidAmount;
                    teacher.purse -= bidAmount;
                    await teacher.save();
                    await student.save();
                    console.log("Auction settled successfully!");
                } catch (err) {
                    console.log(`Blockchain transfer failed and ${err.message}`);
                }
            }
        }
        console.log("Finished auction settlements...");
        res.status(200).json({ message: "Auction settlements completed!" });
    } catch (err) {
        console.log(`Auction settlement error: ${err.message}`);
        res.status(500).json({ message: "Auction settlement failed!", error: err.message });
    }
    // });
});

server.listen(PORT, () => {
    console.log(`Server port : ${PORT}`)
});
