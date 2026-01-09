# Sử dụng phiên bản Node.js nhẹ nhất để tối ưu dung lượng (Yêu cầu của Mentor)
FROM node:alpine

# Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# Sao chép file quản lý thư viện vào trước để tận dụng cache của Docker
COPY package*.json ./

# Cài đặt các thư viện (express, pg, cors,...)
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Thông báo port mà app sẽ chạy (Node.js thường dùng 3000)
EXPOSE 3000

# Lệnh để khởi động server
CMD ["node", "server.js"]