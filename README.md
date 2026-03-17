# 🎫 Helpdesk Ticket System

Hệ thống quản lý ticket hỗ trợ kỹ thuật full-stack với phân quyền theo role, thông báo real-time, và đăng nhập Google OAuth.

---

## 📋 Tổng Quan Tính Năng

| Tính năng | Mô tả |
|-----------|-------|
| 🔐 Xác thực | JWT (Access + Refresh Token), Google OAuth 2.0, Email verification |
| 👥 Phân quyền | 3 role: **ADMIN**, **AGENT**, **USER** — RBAC (Role-Based Access Control) |
| 🎫 Quản lý Ticket | Tạo, sửa, xoá, đổi trạng thái (OPEN → IN_PROGRESS → RESOLVED → CLOSED) |
| 💬 Comment | Real-time comments trên ticket (Socket.IO) |
| 🔔 Thông báo | Persistent notifications lưu DB + real-time push qua Socket.IO |
| 📂 Đính kèm | Upload file đính kèm cho ticket (Multer) |
| 📊 Dashboard | Thống kê ticket theo trạng thái, ưu tiên |
| 🔍 Tìm kiếm | Tìm kiếm ticket với debounce |
| 📄 API Docs | Swagger UI tự động tạo từ JSDoc annotations |

---

## 🛠 Công Nghệ Sử Dụng

### Frontend

| Công nghệ | Phiên bản | Mục đích |
|------------|-----------|----------|
| [React](https://react.dev/) | 19.x | UI framework |
| [Vite](https://vite.dev/) | 8.x | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety |
| [Redux Toolkit](https://redux-toolkit.js.org/) | 2.x | Global state management (auth) |
| [TanStack React Query](https://tanstack.com/query) | 5.x | Server state, caching, auto-refetch |
| [React Router](https://reactrouter.com/) | 7.x | Routing + protected routes |
| [React Hook Form](https://react-hook-form.com/) | 7.x | Form handling |
| [Zod](https://zod.dev/) | 4.x | Schema validation |
| [Axios](https://axios-http.com/) | 1.x | HTTP client + interceptors |
| [Socket.IO Client](https://socket.io/) | 4.x | Real-time communication |
| [Lucide React](https://lucide.dev/) | 0.5x | Icons |
| CSS Modules | built-in | Scoped styling |

### Backend

| Công nghệ | Phiên bản | Mục đích |
|------------|-----------|----------|
| [Node.js](https://nodejs.org/) | ≥ 18 | Runtime |
| [Express](https://expressjs.com/) | 4.x | Web framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety |
| [Prisma ORM](https://www.prisma.io/) | 6.x | Database ORM + migrations |
| [MySQL](https://www.mysql.com/) | ≥ 8.0 | Database |
| [Socket.IO](https://socket.io/) | 4.x | Real-time WebSocket server |
| [JSON Web Token](https://github.com/auth0/node-jsonwebtoken) | 9.x | Authentication |
| [bcrypt](https://github.com/kelektiv/node.bcrypt.js) | 5.x | Password hashing |
| [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs) | 10.x | Google OAuth 2.0 |
| [Nodemailer](https://nodemailer.com/) | 8.x | Email gửi verification |
| [Multer](https://github.com/expressjs/multer) | 2.x | File upload |
| [Helmet](https://helmetjs.github.io/) | 8.x | Security headers |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | 7.x | Rate limiting |
| [Zod](https://zod.dev/) | 3.x | Input validation |
| [Pino](https://getpino.io/) | 9.x | Logging |
| [Swagger](https://swagger.io/) | jsdoc 6.x + ui 5.x | API documentation |
| [tsx](https://github.com/privatenumber/tsx) | 4.x | Dev runner (TypeScript) |

---

## 📁 Cấu Trúc Dự Án

```
helpdesk-ticket-system/
├── client/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/                     # API endpoints + React Query hooks
│   │   │   ├── axios.ts             # Axios instance + interceptors
│   │   │   ├── endpoints.ts         # API functions (tickets, users, comments...)
│   │   │   └── hooks.ts             # Custom hooks (useTickets, useUsers...)
│   │   ├── app/
│   │   │   ├── hooks.ts             # Redux typed hooks
│   │   │   ├── router.tsx           # React Router config
│   │   │   └── store.ts             # Redux store
│   │   ├── components/              # Shared components
│   │   │   ├── AppLayout.tsx        # Sidebar + header layout
│   │   │   └── NotificationDropdown.tsx  # Bell icon + notification list
│   │   ├── features/auth/           # Auth slice (Redux)
│   │   ├── lib/
│   │   │   └── socket.ts            # Socket.IO client
│   │   ├── pages/                   # Page components
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TicketsPage.tsx
│   │   │   ├── TicketDetailPage.tsx
│   │   │   ├── NewTicketPage.tsx
│   │   │   ├── UsersPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   └── index.css                # Design system + global styles
│   └── package.json
│
├── server/                          # Backend (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   ├── migrations/              # SQL migrations
│   │   └── seed.ts                  # Seed data (roles, admin user)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts               # Environment variables
│   │   │   └── swagger.ts           # Swagger configuration
│   │   ├── common/
│   │   │   ├── errors.ts            # Custom error classes
│   │   │   └── types.ts             # Shared TypeScript types
│   │   ├── lib/
│   │   │   ├── prisma.ts            # Prisma client instance
│   │   │   ├── socket.ts            # Socket.IO server + helpers
│   │   │   └── mailer.ts            # Nodemailer transporter
│   │   ├── middlewares/             # Express middlewares
│   │   │   └── index.ts             # auth, authorize, errorHandler, sanitize
│   │   ├── modules/                 # Feature modules
│   │   │   ├── auth/                # Login, register, OAuth, verify email
│   │   │   ├── users/               # User CRUD + roles
│   │   │   ├── tickets/             # Ticket CRUD + status + assign
│   │   │   ├── comments/            # Ticket comments
│   │   │   ├── attachments/         # File upload/download
│   │   │   ├── categories/          # Category CRUD
│   │   │   ├── dashboard/           # Statistics
│   │   │   └── notifications/       # Persistent notifications
│   │   ├── app.ts                   # Express app setup
│   │   └── server.ts                # HTTP + Socket.IO server
│   └── package.json
│
└── package.json                     # Root scripts (concurrently)
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu cầu

- **Node.js** ≥ 18
- **MySQL** ≥ 8.0
- **npm** ≥ 9

### 1. Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd helpdesk-ticket-system
npm run install:all
```

### 2. Cấu hình môi trường

Tạo file `server/.env`:

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/helpdesk"

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# Client URL (CORS + OAuth redirect)
CLIENT_URL=http://localhost:5173

# Server
PORT=4000

# Google OAuth (tùy chọn)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# SMTP - Email verification (tùy chọn)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Khởi tạo Database

```bash
cd server

# Chạy migrations
npx prisma migrate dev

# Seed dữ liệu mẫu (roles + admin user)
npm run db:seed
```

### 4. Chạy development

```bash
# Từ thư mục gốc — chạy cả server + client
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000/api |
| Swagger Docs | http://localhost:4000/api-docs |
| Prisma Studio | `npm run db:studio` (trong thư mục server) |

### 5. Tài khoản mặc định

| Email | Password | Role |
|-------|----------|------|
| admin@helpdesk.com | Admin@123 | ADMIN |

---

## 🔑 Luồng Xác Thực

```
┌─────────┐    POST /auth/login     ┌──────────┐
│  Client  │ ──────────────────────> │  Server  │
│          │ <────────────────────── │          │
│          │   accessToken (body)    │          │
│          │   refreshToken (cookie) │          │
│          │                         │          │
│          │   Authorization:        │          │
│          │   Bearer <accessToken>  │          │
│          │ ──────────────────────> │          │
└─────────┘                         └──────────┘
```

- **Access Token**: gửi qua header `Authorization: Bearer ...` — hết hạn 15 phút
- **Refresh Token**: lưu trong HttpOnly cookie — hết hạn 7 ngày
- **Google OAuth**: redirect flow qua `/api/auth/google` → Google → callback → JWT

---

## 🔔 Hệ Thống Thông Báo

### Real-time (Socket.IO)

| Event | Gửi đến | Khi nào |
|-------|---------|---------|
| `notification:new-ticket` | Staff room | User tạo ticket mới |
| `notification:ticket-assigned` | User cụ thể | Admin assign ticket |
| `notification:new-comment` | Ticket owner + Agent | Có comment mới |
| `ticket:new-comment` | Ticket room | Comment real-time UI |
| `ticket:list-updated` | Tất cả | Có thay đổi CRUD ticket |

### Persistent (Database)

Thông báo được lưu vào bảng `notifications`. Khi user đăng nhập lại → load từ DB → thấy tất cả thông báo dù đã offline lúc gửi.

---

## 📜 Available Scripts

### Root

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy cả server + client (concurrently) |
| `npm run dev:server` | Chạy chỉ server |
| `npm run dev:client` | Chạy chỉ client |
| `npm run install:all` | Cài đặt tất cả dependencies |

### Server (`cd server`)

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy dev server (tsx watch) |
| `npm run build` | Build TypeScript |
| `npm run db:migrate` | Chạy Prisma migrations |
| `npm run db:seed` | Seed dữ liệu mẫu |
| `npm run db:studio` | Mở Prisma Studio GUI |
| `npm run db:reset` | Reset database |

### Client (`cd client`)

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy Vite dev server |
| `npm run build` | Build production |
| `npm run lint` | Chạy ESLint |

---

## 🔒 Bảo Mật

- **Helmet** — Security headers (CSP, HSTS, X-Frame-Options...)
- **CORS** — Chỉ cho phép origin từ `CLIENT_URL`
- **Rate Limiting** — 500 requests / 15 phút (general), 20 requests / 15 phút (auth)
- **bcrypt** — Hash password với salt rounds
- **HttpOnly Cookie** — Refresh token không bị XSS truy cập
- **Input Sanitization** — Chống XSS injection
- **Zod Validation** — Validate tất cả input từ client

---

## 📄 License

MIT
