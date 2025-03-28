package example.com.budgetTracker.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import example.com.budgetTracker.model.Income;
import example.com.budgetTracker.service.IncomeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/user-income")
@CrossOrigin(origins = "https://level4-project.web.app")
public class IncomeController {

    @Autowired
    private IncomeService incomeService;

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

    // Endpoint to update (or add) income for a month
    @PostMapping
    public ResponseEntity<String> updateIncome(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Income income) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        try {
            String uid = getUidFromAuthorization(authHeader);
            // Overwrite userId to ensure security
            income.setUserId(uid);
            incomeService.updateIncome(income);
            return ResponseEntity.ok("Income updated successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating income: " + e.getMessage());
        }
    }


    // Endpoint to retrieve income for a specific month
    @GetMapping
    public ResponseEntity<Income> getIncome(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam String month) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        try {
            String uid = getUidFromAuthorization(authHeader);
            Income income = incomeService.getIncome(uid, month);
            return ResponseEntity.ok(income);
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
