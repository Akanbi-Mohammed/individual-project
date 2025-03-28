package example.com.budgetTracker.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import example.com.budgetTracker.model.Expense;
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
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "https://level4-project.web.app/")  // Update with your frontend's URL
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    /**
     * Helper method to extract and verify the Firebase ID token from the Authorization header.
     * Expects a header of the form "Bearer <idToken>".
     */
    public String getUidFromAuthorization(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
        }
        // Remove "Bearer " prefix to obtain the actual token
        String idToken = authorizationHeader.substring(7);
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            System.out.println("Decoded UID: " + uid);
            return uid;
        } catch (Exception e) {
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token", e);
        }
    }

    @PostMapping
    public ResponseEntity<String> addExpense(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Expense expense) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            expense.setUserId(uid);  // Associate the expense with the authenticated user
            System.out.println("Received request to add expense: " + expense);
            String responseMessage = expenseService.addExpense(expense);
            return ResponseEntity.ok(responseMessage);
        } catch (ResponseStatusException e) {
            e.printStackTrace();
            return ResponseEntity.status(e.getStatus()).body(e.getReason());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding expense: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            List<Expense> expenses = expenseService.getAllExpenses(uid);
            return ResponseEntity.ok(expenses);
        } catch (ResponseStatusException e) {
            e.printStackTrace();
            return ResponseEntity.status(e.getStatus()).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpense(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            Expense expense = expenseService.getExpense(id, uid);
            return ResponseEntity.ok(expense);
        } catch (ResponseStatusException e) {
            e.printStackTrace();
            return ResponseEntity.status(e.getStatus()).build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateExpense(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody Expense expense) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            expense.setUserId(uid);
            String responseMessage = expenseService.updateExpense(id, expense, uid);
            return ResponseEntity.ok(responseMessage);
        } catch (ResponseStatusException e) {
            e.printStackTrace();
            return ResponseEntity.status(e.getStatus()).body(e.getReason());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating expense: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteExpense(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            expenseService.deleteExpense(id, uid);
            return ResponseEntity.ok("Expense deleted successfully");
        } catch (ResponseStatusException e) {
            e.printStackTrace();
            return ResponseEntity.status(e.getStatus()).body(e.getReason());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting expense: " + e.getMessage());
        }
    }
    @DeleteMapping("/byCategory/{category}")
    public ResponseEntity<String> deleteExpensesByCategory(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String category) {
        String uid = getUidFromAuthorization(authHeader);
        try {
            expenseService.deleteExpensesByCategory(uid, category);
            return ResponseEntity.ok("Expenses for category deleted successfully.");
        } catch (Exception e) { // <- changed from specific checked exceptions to catch all
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting expenses: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<String> deleteAllExpenses(@RequestHeader("Authorization") String authHeader) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            String response = expenseService.deleteAllExpenses(uid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting expenses: " + e.getMessage());
        }
    }
    @PutMapping("/updateCategory")
    public ResponseEntity<String> updateExpenseCategory(
            @RequestHeader("Authorization") String authHeader,
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
            expenseService.updateCategory(uid, oldCategory, newCategory);
            return ResponseEntity.ok("Expense categories updated successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating expense categories: " + e.getMessage());
        }
    }
}
