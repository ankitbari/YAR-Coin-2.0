const { io } = require("socket.io-client");

const socket = io("https://fictional-journey-9796755g5qgwc7gwg-5000.app.github.dev");

socket.on("connect", () => {
    socket.emit("joinRoom", {
        userId: "PUT_MEMBER_ID_HERE",
        role: "member"
    });

    setTimeout(() => {
        socket.emit("sendMessage", {
            userId: "PUT_MEMBER_ID_HERE",
            role: "member",
            message: "Hello from member test"
        });
    }, 2000);
});

socket.on("receiveMessage", (msg) => {
    console.log("Member received:", msg);
});