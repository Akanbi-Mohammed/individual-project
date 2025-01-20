package example.com.budgetTracker.controller;

import example.com.budgetTracker.model.Expense;
import example.com.budgetTracker.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "http://localhost:3000")  // Update with your frontend's URL
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @PostMapping
    public String addExpense(@RequestBody Expense expense) {
        try {
            return expenseService.addExpense(expense);
        } catch (Exception e) {
            return "Error adding expense: " + e.getMessage();
        }
    }
    // In your ExpenseController.java
    @GetMapping
    public List<Expense> getAllExpenses() {
        return expenseService.getAllExpenses();
    }


    @GetMapping("/{id}")
    public Expense getExpense(@PathVariable String id) {
        try {
            return expenseService.getExpense(id);
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving expense: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public String updateExpense(@PathVariable String id, @RequestBody Expense expense) {
        try {
            return expenseService.updateExpense(Long.valueOf(id), expense);
        } catch (Exception e) {
            return "Error updating expense: " + e.getMessage();
        }
    }


    @DeleteMapping("{id}")
    public ResponseEntity<String> deleteExpense(@PathVariable Long id) {
        try {
            expenseService.deleteExpense(id);
            return ResponseEntity.ok("Expense deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting expense");
        }
    }

}
