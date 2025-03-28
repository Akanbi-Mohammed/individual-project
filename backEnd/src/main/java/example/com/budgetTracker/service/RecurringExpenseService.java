package example.com.budgetTracker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.RecurringExpense;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class RecurringExpenseService {
    private static final Logger logger = LoggerFactory.getLogger(RecurringExpenseService.class);

    private final Firestore firestore;
    private final ExpenseService expenseService;

    @Autowired
    public RecurringExpenseService(Firestore firestore, ExpenseService expenseService) {
        this.firestore = firestore;
        this.expenseService = expenseService;
    }

    // Create a new recurring expense
    public String addRecurringExpense(RecurringExpense recurringExpense) throws ExecutionException, InterruptedException {
        CollectionReference recurringRef = firestore.collection("recurringExpenses");
        DocumentReference docRef = recurringRef.document();
        recurringExpense.setId(docRef.getId());
        ApiFuture<WriteResult> future = docRef.set(recurringExpense);
        future.get();
        logger.info("Added recurring expense with id: {}", docRef.getId());
        return docRef.getId();
    }

    // Get all active recurring expenses for a user
    public List<RecurringExpense> getRecurringExpenses(String uid) throws ExecutionException, InterruptedException {
        CollectionReference recurringRef = firestore.collection("recurringExpenses");
        Query query = recurringRef.whereEqualTo("userId", uid);
        ApiFuture<QuerySnapshot> querySnapshot = query.get();
        List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
        List<RecurringExpense> recurringExpenses = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            RecurringExpense re = doc.toObject(RecurringExpense.class);
            re.setId(doc.getId());
            recurringExpenses.add(re);
        }
        return recurringExpenses;
    }

    // Update a recurring expense
    public void updateRecurringExpense(String id, RecurringExpense updatedRecurringExpense) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection("recurringExpenses").document(id);
        docRef.set(updatedRecurringExpense, SetOptions.merge()).get();
        logger.info("Updated recurring expense with id: {}", id);
    }

    // Delete (or mark inactive) a recurring expense
    public void deleteRecurringExpense(String id) throws ExecutionException, InterruptedException {
        firestore.collection("recurringExpenses").document(id).delete().get();
        logger.info("Deleted recurring expense with id: {}", id);
    }

    // Helper method to generate period identifier based on frequency using UTC time zone.
    private String generatePeriodIdentifier(String frequency, LocalDate now) {
        String periodIdentifier = "";
        switch (frequency.toLowerCase()) {
            case "monthly":
                periodIdentifier = now.getYear() + "-" + String.format("%02d", now.getMonthValue());
                break;
            case "weekly":
                int weekNumber = now.get(WeekFields.ISO.weekOfWeekBasedYear());
                periodIdentifier = now.getYear() + "-W" + weekNumber;
                break;
            case "yearly":
                periodIdentifier = String.valueOf(now.getYear());
                break;
            default:
                break;
        }
        return periodIdentifier;
    }

    // Helper method to process a single recurring expense for a given user.
    private void processRecurringExpenseForUser(String uid, RecurringExpense rec, LocalDate now) {
        try {
            boolean due = false;
            // Convert start and end dates to LocalDate using UTC.
            LocalDate startDate = rec.getStartDate().toInstant().atZone(ZoneId.of("UTC")).toLocalDate();
            LocalDate endDate = (rec.getEndDate() != null)
                    ? rec.getEndDate().toInstant().atZone(ZoneId.of("UTC")).toLocalDate()
                    : null;

            switch (rec.getFrequency().toLowerCase()) {
                case "monthly":
                    if (now.getDayOfMonth() == rec.getBillingDay() && !now.isBefore(startDate)
                            && (endDate == null || !now.isAfter(endDate))) {
                        due = true;
                    }
                    break;
                case "weekly":
                    if (now.getDayOfWeek() == startDate.getDayOfWeek() && !now.isBefore(startDate)
                            && (endDate == null || !now.isAfter(endDate))) {
                        due = true;
                    }
                    break;
                case "yearly":
                    if (now.getMonth() == startDate.getMonth() && now.getDayOfMonth() == startDate.getDayOfMonth()
                            && !now.isBefore(startDate) && (endDate == null || !now.isAfter(endDate))) {
                        due = true;
                    }
                    break;
                default:
                    logger.warn("Unrecognized frequency '{}' for recurring expense id: {}", rec.getFrequency(), rec.getId());
                    break;
            }

            if (due) {
                String periodIdentifier = generatePeriodIdentifier(rec.getFrequency(), now);
                boolean exists = expenseService.existsRecurringExpense(uid, rec.getId(), periodIdentifier);
                if (!exists) {
                    expenseService.createExpenseFromRecurring(uid, rec, periodIdentifier);
                    logger.info("Synced recurring expense id: {} for user: {} for period: {}", rec.getId(), uid, periodIdentifier);
                } else {
                    logger.debug("Expense already exists for recurring expense id: {} and period: {} for user: {}", rec.getId(), periodIdentifier, uid);
                }
            }
        } catch (Exception e) {
            logger.error("Error processing recurring expense id: {} for user: {}. Error: {}", rec.getId(), uid, e.getMessage());
        }
    }

    // Sync recurring expenses for a specific user
    public void syncRecurringExpenses(String uid) throws ExecutionException, InterruptedException {
        List<RecurringExpense> recurringExpenses = getRecurringExpenses(uid);
        // Use UTC for consistency.
        LocalDate now = LocalDate.now(ZoneId.of("UTC"));

        for (RecurringExpense rec : recurringExpenses) {
            processRecurringExpenseForUser(uid, rec, now);
        }
    }

    // Sync all recurring expenses for all users.
    public void syncAllRecurringExpenses() throws ExecutionException, InterruptedException {
        logger.info("Starting sync for all recurring expenses.");
        CollectionReference recurringRef = firestore.collection("recurringExpenses");
        Query query = recurringRef.whereEqualTo("active", true);
        List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();

        Map<String, List<RecurringExpense>> expensesByUser = new HashMap<>();
        for (QueryDocumentSnapshot doc : documents) {
            RecurringExpense re = doc.toObject(RecurringExpense.class);
            re.setId(doc.getId());
            expensesByUser.computeIfAbsent(re.getUserId(), k -> new ArrayList<>()).add(re);
        }

        LocalDate now = LocalDate.now(ZoneId.of("UTC"));
        for (Map.Entry<String, List<RecurringExpense>> entry : expensesByUser.entrySet()) {
            String uid = entry.getKey();
            List<RecurringExpense> userRecurringExpenses = entry.getValue();
            for (RecurringExpense rec : userRecurringExpenses) {
                processRecurringExpenseForUser(uid, rec, now);
            }
        }
        logger.info("Completed sync for all recurring expenses.");
    }
    public String deleteAllRecurringExpenses(String uid) throws ExecutionException, InterruptedException {
        CollectionReference recurringRef = firestore.collection("recurringExpenses");
        Query query = recurringRef.whereEqualTo("userId", uid);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        if (documents.isEmpty()) {
            throw new RuntimeException("No recurring expenses found for user: " + uid);
        }

        for (QueryDocumentSnapshot document : documents) {
            document.getReference().delete();
        }

        logger.info("Deleted all recurring expenses for user: {}", uid);
        return "All recurring expenses deleted successfully.";
    }
}
