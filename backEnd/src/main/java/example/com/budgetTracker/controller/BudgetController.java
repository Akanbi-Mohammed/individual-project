package example.com.budgetTracker.controller;

import example.com.budgetTracker.model.Budget;
import example.com.budgetTracker.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "http://localhost:3000")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    // Add a new budget
    @PostMapping
    public ResponseEntity<String> addBudget(@RequestBody Budget budget) {
        try {
            String updateTime = budgetService.addBudget(budget);
            return ResponseEntity.ok("Budget added successfully at: " + updateTime);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500).body("Error adding budget: " + e.getMessage());
        }
    }

    // Get budgets by month
    @GetMapping
    public List<Budget> getAllBudgets() throws ExecutionException, InterruptedException {
        return budgetService.getAllBudgets();
    }

    // Edit an existing budget
    @PutMapping("/{id}")
    public ResponseEntity<Budget> editBudget(@PathVariable String id, @RequestBody Budget updatedBudget) {
        try {
            Budget existingBudget = budgetService.getBudgetById(id);

            if (existingBudget == null) {
                return ResponseEntity.notFound().build();
            }

            existingBudget.setCategory(updatedBudget.getCategory());
            existingBudget.setAmount(updatedBudget.getAmount());
            existingBudget.setMonth(updatedBudget.getMonth());

            Budget savedBudget = budgetService.saveBudget(existingBudget);
            return ResponseEntity.ok(savedBudget);
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // Delete a budget by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteBudget(@PathVariable String id) {
        try {
            budgetService.deleteBudget(id);
            return ResponseEntity.ok("Budget deleted successfully.");
        } catch (ExecutionException | InterruptedException e) {
            return ResponseEntity.status(500).body("Error deleting budget: " + e.getMessage());
        }
    }
}
