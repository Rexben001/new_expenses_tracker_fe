# 💸 Expense Tracker Frontend

This is the **frontend application** for an Expense Tracker, built using **React**, **TypeScript**, and **Tailwind CSS**. It allows users to create budgets, track expenses, filter/search transactions, and manage financial records with a clean and responsive interface.

## 🔗 Related Projects

- [Expense Tracker Backend](https://ybnvf6a6ce.execute-api.eu-west-1.amazonaws.com/prod)

---

## 🚀 Features

- 🔍 Filter and search expenses by name, category, month, or year
- 💰 Create and manage budgets
- ➕ Add, duplicate, or delete expenses
- 📊 Visual budget progress using a custom progress bar
- 🌙 Dark mode support
- 📱 Mobile-first responsive UI
- 🧠 State management with React Context
- ⚠️ Disabled double-submit button behavior to avoid duplicate requests

---

## 🛠️ Tech Stack

- **React** with **TypeScript**
- **React Router** for routing
- **Tailwind CSS** for styling
- **React Icons** for icons
- **Netlify** or similar for deployment
- Custom services layer (`services/api.ts`) to communicate with backend APIs

---

## 📦 Installation

```bash
# Clone the repo
git clone https://github.com/your-username/expense-tracker-frontend.git
cd expense-tracker-frontend

# Install dependencies
npm install

# Running the App
npm run dev    # Starts Vite development server
```

## 📁 Project Structure

```
src/
│
├── components/        # Reusable UI components (e.g. ExpenseBox, FilterPopup)
├── hooks/             # Custom hooks (e.g. useItemContext, useExpenseSearch)
├── pages/             # React pages (e.g. BudgetIdPage.tsx)
├── services/          # API calls and utility functions
├── types/             # TypeScript types and interfaces
├── App.tsx            # Main App component
└── main.tsx           # Entry point

```