# Personal Finance Tracker

A full-stack personal finance tracking application built with React and Node.js, integrated with Supabase (PostgreSQL) for data persistence.

## Features

- **Dashboard**: View key financial metrics, monthly budget, spending categories, and upcoming reminders
- **Transaction History**: Track all income and expenses with search and filter capabilities
- **Reports**: Analyze spending patterns with monthly and yearly charts
- **Reminders**: Set up payment reminders for bills and upcoming expenses

## Tech Stack

- **Frontend**: React 18, React Router, Axios, Recharts
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Supabase)
- **Styling**: CSS3 with modern design

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd personal-finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up Supabase Database**
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor and run the schema from `backend/database/schema.sql`
   - Copy your Supabase URL and anon key

4. **Configure Backend Environment**
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your Supabase credentials:
     ```
     PORT=5000
     SUPABASE_URL=your_supabase_project_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Configure Frontend Environment (Optional)**
   - Create `frontend/.env` if you want to customize the API URL:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     ```

### Running the Application

**Option 1: Run both frontend and backend together**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Database Schema

The application uses two main tables:

### Transactions
- `id`: Primary key
- `type`: 'income' or 'expense'
- `amount`: Decimal value
- `category`: Transaction category
- `description`: Transaction description
- `date`: Transaction date
- `created_at`, `updated_at`: Timestamps

### Reminders
- `id`: Primary key
- `title`: Reminder title
- `amount`: Amount due
- `category`: Reminder category
- `due_date`: Due date
- `is_completed`: Boolean flag
- `created_at`, `updated_at`: Timestamps

## API Endpoints

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/budget` - Get monthly budget
- `GET /api/dashboard/categories` - Get top spending categories

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
- `POST /api/transactions` - Create a new transaction

### Reminders
- `GET /api/reminders` - Get all reminders
- `POST /api/reminders` - Create a new reminder

### Reports
- `GET /api/reports/monthly` - Get monthly report data
- `GET /api/reports/yearly` - Get yearly overview data

## Project Structure

```
personal-finance-tracker/
├── backend/
│   ├── database/
│   │   └── schema.sql
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── package.json
```

## Notes

- The application is designed to work with Supabase Row Level Security (RLS). The default policies allow all operations. In production, you should implement proper authentication and restrict access based on user_id.
- The monthly budget is currently set to $3,000 by default. This can be made configurable in future updates.

## License

MIT


