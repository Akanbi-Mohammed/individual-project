package example.com.budgetTracker.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import example.com.budgetTracker.model.Budget;
import example.com.budgetTracker.service.BudgetService;
import example.com.budgetTracker.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "https://level4-project.web.app/")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;
    @Autowired
    private ExpenseService expenseService;

    /**
     * Extracts the UID from the Authorization header using Firebase Admin.
     * Expects the header to be in the format "Bearer <token>".
     */
    public String getUidFromAuthorization(String authHeader) {
        // Here we assume that authHeader is already checked for null or emptiness.
        String token = authHeader;
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
            return decodedToken.getUid();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token", e);
        }
    }

    // Add a new budget for the authenticated user
    @PostMapping
    public ResponseEntity<String> addBudget(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Budget budget) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        try {
            String uid = getUidFromAuthorization(authHeader);
            // Set the userId on the budget object
            budget.setUserId(uid);
            String updateTime = budgetService.addBudget(budget);
            return ResponseEntity.ok("Budget added successfully at: " + updateTime);
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error adding budget: " + e.getMessage());
        }
    }

    // Get all budgets for the authenticated user
    @GetMapping
    public ResponseEntity<List<Budget>> getAllBudgets(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        try {
            String uid = getUidFromAuthorization(authHeader);
            List<Budget> budgets = budgetService.getAllBudgets(uid);
            return ResponseEntity.ok(budgets);
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // Edit an existing budget (only if it belongs to the authenticated user)
    @PutMapping("/{id}")
    public ResponseEntity<Budget> editBudget(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody Budget updatedBudget) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        try {
            String uid = getUidFromAuthorization(authHeader);
            Budget existingBudget = budgetService.getBudgetById(id, uid);
            if (existingBudget == null) {
                return ResponseEntity.notFound().build();
            }
            // Update fields (userId remains unchanged)
            existingBudget.setCategory(updatedBudget.getCategory());
            existingBudget.setAmount(updatedBudget.getAmount());
            existingBudget.setMonth(updatedBudget.getMonth());
            Budget savedBudget = budgetService.saveBudget(existingBudget);
            return ResponseEntity.ok(savedBudget);
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // Delete a budget by ID for the authenticated user
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBudget(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        try {
            String uid = getUidFromAuthorization(authHeader);
            budgetService.deleteBudget(id, uid);
            return ResponseEntity.ok("Budget deleted successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error deleting budget: " + e.getMessage());
        }
    }
    @PutMapping("/updateCategory")
    public ResponseEntity<String> updateBudgetCategory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, String> payload) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        String uid = getUidFromAuthorization(authHeader);
        String oldCategory = payload.get("oldCategory");
        String newCategory = payload.get("newCategory");
        if (oldCategory == null || newCategory == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing oldCategory or newCategory");
        }
        try {
            budgetService.batchUpdateCategory(uid, oldCategory, newCategory);
            return ResponseEntity.ok("Expense categories updated successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating expense categories: " + e.getMessage());
        }
    }
    @DeleteMapping("/byCategory/{category}")
    public ResponseEntity<String> deleteBudgetsByCategory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String category) {
        String uid = getUidFromAuthorization(authHeader);
        try {
            budgetService.deleteBudgetsByCategory(uid, category);
            return ResponseEntity.ok("Budgets for category deleted successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting budgets: " + e.getMessage());
        }
    }
    @DeleteMapping("/deleteWithExpenses/{budgetId}")
    public ResponseEntity<String> deleteBudgetAndExpenses(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String budgetId
    ) {
        try {
            // 1) Extract user ID
            String uid = getUidFromAuthorization(authHeader);

            // 2) Fetch the budget from Firestore
            Budget budget = budgetService.getBudgetById(budgetId, uid);
            if (budget == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Budget not found or does not belong to the user.");
            }

            // 3) Get the budget's category
            String category = budget.getCategory();
            if (category == null || category.trim().isEmpty()) {
                // If no category, just delete the budget
                budgetService.deleteBudget(budgetId, uid);
                return ResponseEntity.ok("Budget deleted (no category found).");
            }

            // 4) Delete all expenses with that category
            //    (Make sure your expenseService uses Firestore & deleteExpensesByCategory)
            expenseService.deleteExpensesByCategory(uid, category);

            // 5) Now delete the budget
            budgetService.deleteBudget(budgetId, uid);

            return ResponseEntity.ok("Budget and all associated expenses deleted successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting budget and associated expenses: " + e.getMessage());
        }
    }
    @DeleteMapping("/delete-all")
    public ResponseEntity<String> deleteAllBudgets(@RequestHeader("Authorization") String authHeader) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            String response = budgetService.deleteAllBudgets(uid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting budgets: " + e.getMessage());
        }
    }

}
