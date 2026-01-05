// file: server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let waitingQueues = { 'gay': null, 'les': null, 'other': null };
let roomMessages = {}; 
let reports = [];

io.on('connection', (socket) => {
    
    // --- PHẦN 1: CHAT & MATCH (GIỮ NGUYÊN) ---
    socket.on('find_match', (userData) => {
        const type = userData.type;
        const partner = waitingQueues[type];

        if (partner && partner.id !== socket.id) {
            const roomID = partner.id + '#' + socket.id;
            socket.join(roomID);
            partner.join(roomID);
            roomMessages[roomID] = [];

            // Báo cho cả 2 biết đã tìm thấy
            io.to(roomID).emit('match_found', roomID);
            
            waitingQueues[type] = null;
        } else {
            waitingQueues[type] = socket;
            socket.emit('waiting', `Đang tìm bạn ${type}...`);
        }
    });

    socket.on('send_msg', (data) => {
        const { roomID, msg } = data;
        if (roomMessages[roomID]) {
            roomMessages[roomID].push({ sender: socket.id, msg: msg, time: new Date().toLocaleTimeString() });
        }
        socket.to(roomID).emit('receive_msg', msg);
    });

    socket.on('report_user', (data) => {
        const { roomID, reason } = data;
        const evidence = roomMessages[roomID] || [];
        reports.push({ id: Date.now(), reporter: socket.id, roomID, reason, chatLog: evidence });
        io.to(roomID).emit('chat_ended', 'Đoạn chat bị hủy do báo cáo.');
        delete roomMessages[roomID];
    });

    socket.on('admin_get_data', () => socket.emit('admin_data', reports));

    socket.on('disconnect', () => {
        for (const [key, waitingSocket] of Object.entries(waitingQueues)) {
            if (waitingSocket && waitingSocket.id === socket.id) waitingQueues[key] = null;
        }
    });

    // --- PHẦN 2: VIDEO CALL (MỚI THÊM) ---
    // Khi User A có Camera, gửi ID video của A cho User B
    socket.on('share_video_id', (data) => {
        const { roomID, peerID } = data;
        // Gửi ID này cho người kia trong phòng (trừ người gửi)
        socket.to(roomID).emit('receive_video_id', peerID);
    });
});

server.listen(3000, () => {
    console.log('Server Video chạy tại: http://localhost:3000');
});