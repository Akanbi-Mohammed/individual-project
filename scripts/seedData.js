// seedData.js
const admin = require("firebase-admin");
const serviceAccount = require("C:/Users/Mohammed/Downloads/year4_project/scripts/level4-project-firebase-adminsdk-ge8lr-03afacce02.json");

// Initialize the Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://level4-project-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

// Use your real Firebase Auth UID:
const REAL_USER_ID = "7cMLBJIePfNcObEeyZQ28VIBATP2";

// 1) Test Categories:
const testCategories = [
    "Groceries",
    "Rent",
    "Entertainment",
    "Utilities",
    "Travel",
    "Healthcare",
    "Misc",
];

// 2) Test Budgets (ensure total expenses do not exceed these amounts)
// February (assumed income ~40k)
const testBudgets = [
    { userId: REAL_USER_ID, category: "Groceries",     amount: 8000,  month: "2025-02" },
    { userId: REAL_USER_ID, category: "Rent",          amount: 15000, month: "2025-02" },
    { userId: REAL_USER_ID, category: "Entertainment", amount: 3000,  month: "2025-02" },
    { userId: REAL_USER_ID, category: "Utilities",     amount: 4000,  month: "2025-02" },
    { userId: REAL_USER_ID, category: "Travel",        amount: 5000,  month: "2025-02" },
    { userId: REAL_USER_ID, category: "Healthcare",    amount: 2000,  month: "2025-02" },
    { userId: REAL_USER_ID, category: "Misc",          amount: 3000,  month: "2025-02" },
    // March (assumed income ~15k)
    { userId: REAL_USER_ID, category: "Groceries",     amount: 3000,  month: "2025-03" },
    { userId: REAL_USER_ID, category: "Rent",          amount: 7000,  month: "2025-03" },
    { userId: REAL_USER_ID, category: "Entertainment", amount: 1500,  month: "2025-03" },
    { userId: REAL_USER_ID, category: "Utilities",     amount: 1500,  month: "2025-03" },
    { userId: REAL_USER_ID, category: "Travel",        amount: 500,   month: "2025-03" },
    { userId: REAL_USER_ID, category: "Healthcare",    amount: 500,   month: "2025-03" },
    { userId: REAL_USER_ID, category: "Misc",          amount: 1000,  month: "2025-03" },
];

// 3) Test Expenses (make sure the sum for each category is less than or equal to its budget)
const testExpenses = [
    // February
    { userId: REAL_USER_ID, category: "Rent",          amount: 15000, date: "2025-02-01", description: "Rent payment" },
    { userId: REAL_USER_ID, category: "Groceries",     amount: 1200,  date: "2025-02-03", description: "Supermarket" },
    { userId: REAL_USER_ID, category: "Entertainment", amount: 1500,  date: "2025-02-05", description: "Concert tickets" },
    { userId: REAL_USER_ID, category: "Groceries",     amount: 2500,  date: "2025-02-10", description: "Bulk groceries" },
    { userId: REAL_USER_ID, category: "Healthcare",    amount: 1000,  date: "2025-02-11", description: "Doctor visit" },
    { userId: REAL_USER_ID, category: "Travel",        amount: 3500,  date: "2025-02-15", description: "Weekend trip" },
    { userId: REAL_USER_ID, category: "Entertainment", amount: 900,   date: "2025-02-18", description: "Movies" },
    { userId: REAL_USER_ID, category: "Utilities",     amount: 1500,  date: "2025-02-20", description: "Bills" },
    { userId: REAL_USER_ID, category: "Misc",          amount: 2000,  date: "2025-02-25", description: "Clothing" },
    { userId: REAL_USER_ID, category: "Utilities",     amount: 2500,  date: "2025-02-28", description: "Phone & internet" },
    // March
    { userId: REAL_USER_ID, category: "Rent",          amount: 7000,  date: "2025-03-01", description: "Rent payment" },
    { userId: REAL_USER_ID, category: "Groceries",     amount: 500,   date: "2025-03-03", description: "Grocery run" },
    { userId: REAL_USER_ID, category: "Utilities",     amount: 1200,  date: "2025-03-05", description: "Bills" },
    { userId: REAL_USER_ID, category: "Entertainment", amount: 800,   date: "2025-03-07", description: "Bowling" },
    { userId: REAL_USER_ID, category: "Groceries",     amount: 1400,  date: "2025-03-10", description: "Grocery haul" },
    { userId: REAL_USER_ID, category: "Healthcare",    amount: 200,   date: "2025-03-14", description: "Pharmacy" },
    { userId: REAL_USER_ID, category: "Travel",        amount: 300,   date: "2025-03-15", description: "Bus tickets" },
    { userId: REAL_USER_ID, category: "Entertainment", amount: 500,   date: "2025-03-25", description: "Streaming" },
    { userId: REAL_USER_ID, category: "Misc",          amount: 600,   date: "2025-03-28", description: "Supplies" },
];

async function seedCategories() {
    try {
        const categoriesRef = db.collection("categories");
        await categoriesRef.doc(REAL_USER_ID).set({ categories: testCategories });
        console.log("Categories added for user:", REAL_USER_ID);
    } catch (error) {
        console.error("Error seeding categories:", error);
    }
}

async function seedBudgets() {
    try {
        const budgetsRef = db.collection("budgets");
        for (const budget of testBudgets) {
            // Let Firestore generate the document ID
            const docRef = await budgetsRef.add(budget);
            console.log(`Budget created with ID: ${docRef.id} for category: ${budget.category} in month: ${budget.month}`);
        }
    } catch (error) {
        console.error("Error seeding budgets:", error);
    }
}

async function seedExpenses() {
    try {
        const expensesRef = db.collection("expenses");
        for (const expense of testExpenses) {
            const docRef = await expensesRef.add(expense);
            console.log(`Expense created with ID: ${docRef.id} for category: ${expense.category} on date: ${expense.date}`);
        }
    } catch (error) {
        console.error("Error seeding expenses:", error);
    }
}

async function seedAllData() {
    try {
        await seedCategories();
        await seedBudgets();
        await seedExpenses();
        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
}

seedAllData();
