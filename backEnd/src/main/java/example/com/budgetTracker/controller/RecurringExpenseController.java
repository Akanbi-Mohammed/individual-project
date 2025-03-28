package example.com.budgetTracker.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import example.com.budgetTracker.model.RecurringExpense;

import example.com.budgetTracker.service.RecurringExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/recurring-expenses")
@CrossOrigin(origins = "https://level4-project.web.app")
public class RecurringExpenseController {

    @Autowired
    public RecurringExpenseService recurringExpenseService;

    // Helper to get uid from Firebase token
    public String getUidFromAuthorization(String authHeader) {
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

    // Create a new recurring expense
    @PostMapping
    public ResponseEntity<String> addRecurringExpense(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody RecurringExpense recurringExpense) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        String uid = getUidFromAuthorization(authHeader);
        recurringExpense.setUserId(uid);
        try {

            String id = recurringExpenseService.addRecurringExpense(recurringExpense);


            recurringExpenseService.syncRecurringExpenses(uid);


            return ResponseEntity.ok("Recurring expense added and synced with id: " + id);
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error adding recurring expense: " + e.getMessage());
        }
    }

    // Get all recurring expenses for the authenticated user
    @GetMapping
    public ResponseEntity<List<RecurringExpense>> getRecurringExpenses(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        String uid = getUidFromAuthorization(authHeader);
        try {
            List<RecurringExpense> recurringExpenses = recurringExpenseService.getRecurringExpenses(uid);
            return ResponseEntity.ok(recurringExpenses);
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Update an existing recurring expense
    @PutMapping("/{id}")
    public ResponseEntity<String> updateRecurringExpense(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id,
            @RequestBody RecurringExpense recurringExpense) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        String uid = getUidFromAuthorization(authHeader);
        recurringExpense.setUserId(uid);
        try {
            recurringExpenseService.updateRecurringExpense(id, recurringExpense);
            return ResponseEntity.ok("Recurring expense updated successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating recurring expense: " + e.getMessage());
        }
    }

    // Delete a recurring expense
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteRecurringExpense(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable String id) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        try {
            recurringExpenseService.deleteRecurringExpense(id);
            return ResponseEntity.ok("Recurring expense deleted successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting recurring expense: " + e.getMessage());
        }
    }
    @PostMapping("/sync")
    public ResponseEntity<String> syncRecurringExpenses(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        String uid = getUidFromAuthorization(authHeader);
        try {
            // This method should handle the logic of checking recurring expenses and creating
            // corresponding expense records if they're due.
            recurringExpenseService.syncRecurringExpenses(uid);
            return ResponseEntity.ok("Recurring expenses synced successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error syncing recurring expenses: " + e.getMessage());
        }
    }
    @DeleteMapping("/delete-all")
    public ResponseEntity<String> deleteAllRecurringExpenses(@RequestHeader("Authorization") String authHeader) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            String response = recurringExpenseService.deleteAllRecurringExpenses(uid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting recurring expenses: " + e.getMessage());
        }
    }
}
