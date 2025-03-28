package example.com.budgetTracker.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import example.com.budgetTracker.model.Category;
import example.com.budgetTracker.service.BudgetService;
import example.com.budgetTracker.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "https://level4-project.web.app")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;
    @Autowired
    private BudgetService budgetService;

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

    // GET /api/categories – returns the user's categories as an array
    @GetMapping
    public ResponseEntity<?> getCategories(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }
        String uid = getUidFromAuthorization(authHeader);
        try {
            return ResponseEntity.ok(categoryService.getCategories(uid));
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving categories");
        }
    }

    // PUT /api/categories – updates the user's categories with the provided list
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing category values");
        }
        try {
            budgetService.batchUpdateCategory(uid, oldCategory, newCategory);
            return ResponseEntity.ok("Budget categories updated successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating budget categories: " + e.getMessage());
        }
    }
    @PutMapping
    public ResponseEntity<String> updateUserCategories(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Category categoryRequest
    ) {
        if (authHeader == null || authHeader.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
        }

        String uid = getUidFromAuthorization(authHeader);

        if (categoryRequest == null || categoryRequest.getCategories() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid category data");
        }

        try {
            categoryService.updateCategories(uid, categoryRequest.getCategories());
            return ResponseEntity.ok("Categories updated successfully.");
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating categories: " + e.getMessage());
        }
    }

    @DeleteMapping("/delete-all")
    public ResponseEntity<String> deleteAllCategories(@RequestHeader("Authorization") String authHeader) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            String response = categoryService.deleteAllCategories(uid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting categories: " + e.getMessage());
        }
    }
    @DeleteMapping("/byCategory/{category}")
    public ResponseEntity<String> deleteCategoryByName(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable String category) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            String response = categoryService.deleteCategoryByName(uid, category);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting category: " + e.getMessage());
        }
    }

}
