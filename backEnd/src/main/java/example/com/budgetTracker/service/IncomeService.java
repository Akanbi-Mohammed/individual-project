package example.com.budgetTracker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Income;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@Service
public class IncomeService {


    private final Firestore firestore;
    @Autowired
    public IncomeService(Firestore firestore) {
        this.firestore = firestore;
    }

    // Update or add income for a given user and month
    public void updateIncome(Income income) throws ExecutionException, InterruptedException {
        // The document for this user in "incomes"
        DocumentReference docRef = firestore.collection("incomes").document(income.getUserId());

        // We'll store the user's ID and the month->amount mapping
        Map<String, Object> data = new HashMap<>();
        data.put("userId", income.getUserId());  // optional, but nice to keep
        data.put(income.getMonth(), income.getAmount()); // e.g. "2025-02": 4000

        // Use merge so we don't overwrite other months
        ApiFuture<WriteResult> writeResult = docRef.set(data, SetOptions.merge());
        // Wait for commit to complete
        writeResult.get();
    }
    // Retrieve income for a given user and month
    public Income getIncome(String uid, String month) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection("incomes").document(uid);
        DocumentSnapshot document = docRef.get().get();
        if (document.exists()) {
            // Grab the Double from the field named e.g. "2025-02"
            Double amount = document.getDouble(month);
            if (amount != null) {
                // Return an Income object with that amount
                return new Income(uid, month, amount);
            }
        }
        // If doc doesn't exist or field not found, return 0
        return new Income(uid, month, 0);
    }
}
