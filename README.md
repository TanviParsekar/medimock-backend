````md
# MediMock - Backend

This is the **backend** for MediMock, a mock AI-based symptom checker built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**.

---

## 🚀 Features

- User registration and login (JWT-based)
- Role-based authorization (User / Admin)
- Track and store symptom inputs
- Generate mock AI responses
- Monthy symptom analytics endpoint
- Admin endpoints for user management
- Validations via Zod

---

## 🛠️ Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM
- Zod for validation
- Bcrypt for password hashing
- JWT for authentication

---

## 🔧 Setup Instructions

1. **Clone the repo:**
   ```bash
   git clone https://github.com/your-username/MediMock.git
   cd MediMock
   ```
````

2. Install dependencies:
   ```bash
   npm install
   ```
3. Create .env file:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/medimock"
   JWT_SECRET="your-secret"
   PORT=5000
   ```
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
5. Run DB Migrations:

   ```bash
   npx prisma migrate dev --name init

   ```

6. Start the server:
   ```bash
   npm run dev
   ```
