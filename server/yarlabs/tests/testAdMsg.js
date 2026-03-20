const { io } = require("socket.io-client");

const socket = io("https://fictional-journey-9796755g5qgwc7gwg-5000.app.github.dev");

socket.on("connect", () => {
    socket.emit("joinRoom", {
        userId: "6996ba04d3efbe3c0cd891b4",
        role: "admin"
    });

    setTimeout(() => {
        socket.emit("sendMessage", {
            userId: "6996ba04d3efbe3c0cd891b4",
            role: "admin",
            message: "Hello, but never commit on main brach"
        });
    }, 2000);
});

socket.on("receiveMessage", (msg) => {
    console.log("Member received:", msg);
});