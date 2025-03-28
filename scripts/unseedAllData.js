/* unseedData.js */
const admin = require("firebase-admin");
const serviceAccount = require("C:/Users/Mohammed/Downloads/year4_project/scripts/level4-project-firebase-adminsdk-ge8lr-03afacce02.json");

// Initialize Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://level4-project-default-rtdb.firebaseio.com",
});

const db = admin.firestore();

// The user for which we want to remove test data:
const REAL_USER_ID = "7cMLBJIePfNcObEeyZQ28VIBATP2";

// The months we want to remove (in your test data, 2025-02 & 2025-03):
const monthsToRemove = ["2025-02", "2025-03"];

// We'll also remove the categories doc if it only contained test categories
const removeCategoriesDoc = true;

async function deleteBudgets() {
    console.log("Deleting test budgets for user", REAL_USER_ID);
    for (const month of monthsToRemove) {
        // Query all budgets for that user & month
        const querySnap = await db
            .collection("budgets")
            .where("userId", "==", REAL_USER_ID)
            .where("month", "==", month)
            .get();

        const batch = db.batch();
        querySnap.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`Deleted budgets for month: ${month}, count: ${querySnap.size}`);
    }
}

async function deleteExpenses() {
    console.log("Deleting test expenses for user", REAL_USER_ID);
    // For each month (e.g. 2025-02), we look for expenses whose date starts with that
    // Firestore doesn't have a "startsWith" query, so we'll do range queries if you prefer.
    // But for a quick approach, just fetch all user expenses, filter in JS:
    const allSnap = await db
        .collection("expenses")
        .where("userId", "==", REAL_USER_ID)
        .get();

    // Filter by date:
    const batch = db.batch();
    let removedCount = 0;

    allSnap.forEach((doc) => {
        const data = doc.data();
        if (!data.date) return;
        // If data.date is e.g. "2025-02-10", then data.date.slice(0,7) = "2025-02"
        const datePrefix = data.date.slice(0, 7);
        if (monthsToRemove.includes(datePrefix)) {
            batch.delete(doc.ref);
            removedCount++;
        }
    });

    if (removedCount > 0) {
        await batch.commit();
    }
    console.log(`Deleted expenses for months: ${monthsToRemove.join(", ")}. Count: ${removedCount}`);
}

async function deleteCategoriesDoc() {
    if (!removeCategoriesDoc) return;
    console.log("Removing categories doc for user", REAL_USER_ID);
    const docRef = db.collection("categories").doc(REAL_USER_ID);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        await docRef.delete();
        console.log("Categories doc deleted for user:", REAL_USER_ID);
    } else {
        console.log("No categories doc found for user:", REAL_USER_ID);
    }
}

async function unseedAllData() {
    try {
        await deleteBudgets();
        await deleteExpenses();
        await deleteCategoriesDoc();

        console.log("Unseeding (test data removal) completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error removing test data:", error);
        process.exit(1);
    }
}

unseedAllData();
