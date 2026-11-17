# Pharma Care (MySQL)


## About

Pharma Care is a full-stack web application backed by a MySQL database, with a separate `frontend` and `backend`.

_TODO: 2-3 sentences on what it manages and who uses it (pharmacists, customers, admins...)._
_

## Tech Stack

| Layer    | Technology            |
| -------- | --------------------- |
| Frontend | _TODO (frontend/)_    |
| Backend  | _TODO (backend/), Node.js-based project (root package.json) |
| Database | MySQL                 |

## Project Structure

```
pharma-care-mysql/
├── backend/            # Server / API
├── frontend/           # User interface
├── package.json
├── package-lock.json
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended) and npm
- MySQL Server (8.x recommended)

### 1. Clone the repository

```bash
git clone https://github.com/SwaroopDangal/pharma-care-mysql.git
cd pharma-care-mysql
```

### 2. Set up the database

```sql
CREATE DATABASE pharma_care;
```

_TODO: mention any schema / seed `.sql` file and how to import it, e.g._
`mysql -u root -p pharma_care < schema.sql`

### 3. Install dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

_Adjust if the root `package.json` already runs both apps._

### 4. Configure environment variables

Create a `.env` file in `backend/`:

```env
# TODO: replace with the variables your backend actually reads
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pharma_care
JWT_SECRET=
```

### 5. Run the app

```bash
# backend
cd backend
npm start

# frontend (new terminal)
cd frontend
npm run dev
```

## Usage

_TODO: Describe the main user flows, ideally with screenshots._

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request


## Author

**Swaroop Dangal** — [@SwaroopDangal](https://github.com/SwaroopDangal)
