# 💸 Personal Budget Tracker - Final Year Project

**Mohammed Mustapha Akanbi**  
📧 Student ID: 2630425a  
👨‍🏫 Supervisor: Dr. Sofiat Olaosebikan

[![Live Demo](https://img.shields.io/badge/Live_Demo-Available-green?style=for-the-badge)](https://level4-project.web.app)
[![Project Wiki](https://img.shields.io/badge/Project_Wiki-Documentation-blue?style=for-the-badge)](https://github.com/Akanbi-Mohammed/individual-project/wiki)

---

## 🌟 Overview

A modern web application that helps users track their finances with intuitive budgeting tools, expense tracking, and insightful analytics.

🔹 **Key Benefits:**
- Visualize spending patterns with interactive charts
- Set and track financial goals
- Manage recurring expenses automatically
- Accessible across all devices

---

## 🚀 Features

### 💳 Core Functionality
- **Secure Authentication** with Firebase
- **Budget Management** by categories
- **Expense Tracking** with detailed records
- **Recurring Payments** automation
- **Financial Goals** with progress tracking

### 📊 Analytics & Insights
- Interactive spending charts
- Monthly budget progress
- Expense categorization
- Custom reporting

### 🎯 User Experience
- Responsive design (mobile/desktop)
- Interactive tutorials
- Auto-currency detection
- Dark/Light mode

---

## 🛠 Tech Stack

| Component       | Technologies Used                          |
|-----------------|-------------------------------------------|
| **Frontend**    | React, CSS Modules, Chart.js, Joyride     |
| **Backend**     | Spring Boot, Firebase Admin SDK           |
| **Database**    | Firebase Firestore (NoSQL)                |
| **Authentication** | Firebase Auth                         |
| **Hosting**     | Firebase Hosting (Frontend)               |

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+ & npm v9+
- Java 17+
- Maven
- Firebase account

### Quick Start
```bash
# Clone repository
git clone https://github.com/Akanbi-Mohammed/individual-project.git
cd individual-project

# Start backend
cd backend && ./mvnw spring-boot:run

# In new terminal - start frontend
cd frontend && npm install && npm start
```
### Testing
- Manual Testing: Interact with the app on https://level4-project.web.app to verify core features.

- Automated Tests: (Work in progress) Use testing frameworks (e.g., Jest for frontend, JUnit for backend) to run test suites.

- Dummy Data: Use the provided scripts to add dummy data for stress testing the analytics page.
### Deployment
- Frontend: Deployed on Firebase Hosting (https://level4-project.web.app)

- Backend: Deployed via Google Cloud Run 

- Authentication & Database: Managed by Firebase Authentication and Firestore

### Documentation
- Manual: manual.md – How to use the application.

- Plan: plan.md – Detailed weekly project plan.

- Timelog: timelog.md – Recorded hours for the project.

- Wiki: Project Wiki – Meeting logs, evaluations, and further documentation.