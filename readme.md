# 💸 Final Year Project – Budget Tracker

Welcome to my final year individual project: a **Personal Budget Tracker** web application.

This app helps users take control of their finances by tracking expenses, setting budgets, and managing financial goals.

🔗 The app is live at: [https://level4-project.web.app](https://level4-project.web.app)

📘 For technical details and deeper insights, check the [Project Wiki](https://github.com/Akanbi-Mohammed/individual-project/wiki)

---

## 🔧 Features

- 🔐 Firebase Authentication (Sign up, Login, Password Reset, Account Deletion)
- 📊 Budget management with per-category monthly limits
- 🧾 Expense tracking with category, description, amount, and date
- 🔁 Recurring expense automation (e.g., subscriptions, rent)
- 🎯 Goal setting and progress tracking with milestones and alerts
- 📍 Auto-detect location and default currency via IP
- 🧭 Interactive in-app tutorials powered by Joyride
- 📱 Fully responsive UI – works on desktop, tablet, and mobile

---

## 🛠 Tech Stack

| Layer     | Tools                                    |
|-----------|------------------------------------------|
| Frontend  | React, CSS Modules, SweetAlert2, Joyride |
| Backend   | Spring Boot, Firebase Admin SDK          |
| Auth      | Firebase Authentication                  |
| Database  | Firebase Firestore                       |
| Hosting   | Firebase Hosting (Frontend)              |

---

## How to Run (Frontend + Backend)

```bash
# Clone the repo
git clone https://github.com/Akanbi-Mohammed/individual-project.git
cd individual-project

# Start the backend
cd backend
./mvnw spring-boot:run

# Open a new terminal, then:
cd frontend
npm install
npm start
