# FCS HRMS (Human Resource Management System)

A production-ready, secure, scalable, and modular Human Resource Management System (HRMS) built for FCS.

## Project Structure
The repository is split into two independent modules:
- `/backend`: NestJS REST API with Prisma ORM and MySQL.
- `/frontend`: Next.js App Router portal using ShadCN UI, Zustand, and TanStack Query.

---

## 🛠️ Technology Stack

### Backend
- **Framework:** NestJS (TypeScript)
- **Database ORM:** Prisma ORM
- **Security:** Bcrypt (Password Hashing), Passport JWT, Helmet (HTTP Headers), Cookie-Parser
- **Logger:** Winston custom logger

### Frontend
- **Framework:** Next.js (App Router, Tailwind CSS, TypeScript)
- **State Management:** Zustand
- **Query Handling:** TanStack Query & Axios
- **Form validation:** React Hook Form with Zod

---

## 🚀 Setup & Installation

### Prerequisite
Ensure you have Node.js (v18+) and a running MySQL instance.

### Step 1: Database Setup
1. Create a MySQL database named `fcs_hrms`
2. Update the environment file `backend/.env` with your credentials:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/fcs_hrms"
   ```

### Step 2: Running the Backend API
1. Navigate to `/backend`
2. Install packages:
   ```bash
   npm install
   ```
3. Generate Prisma client & migrate:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Seed the default Roles, Departments, and Admin HR Account:
   ```bash
   npm run seed
   ```
5. Run the dev server:
   ```bash
   npm run start:dev
   ```
*The API will start running at `http://localhost:4000/api/v1`*
*The API Swagger Docs will be interactive at `http://localhost:4000/api/v1/docs`*

### Step 3: Running the Frontend Portal
1. Navigate to `/frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
*The application will boot at `http://localhost:3000`*

---

## 🏗️ Clean Coding & Architectural Standards
1. **Separation of Concerns:** Zero frontend code leaks into backend, and vice-versa.
2. **SOLID Principles:** Modules are self-contained with strict service-level decoupling.
3. **Data Security:** All sensitive fields are hashed, JWT contains non-critical claims, and strict RBAC guards control HR vs. Employee actions.
