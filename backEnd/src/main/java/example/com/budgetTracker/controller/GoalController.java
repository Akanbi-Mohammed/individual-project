package example.com.budgetTracker.controller;

import example.com.budgetTracker.model.Goal;
import example.com.budgetTracker.service.GoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/goals")
@CrossOrigin(origins = "http://localhost:3000")
public class GoalController {

    @Autowired
    private GoalService goalService;

    @PostMapping
    public ResponseEntity<String> addGoal(@RequestBody Goal goal) throws InterruptedException, ExecutionException {
        String message = goalService.addGoal(goal);
        return ResponseEntity.ok(message);
    }

    @GetMapping
    public ResponseEntity<List<Goal>> getAllGoals() throws InterruptedException, ExecutionException {
        List<Goal> goals = goalService.getAllGoals();
        return ResponseEntity.ok(goals);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Goal> getGoalById(@PathVariable String id) throws InterruptedException, ExecutionException {
        Goal goal = goalService.getGoalById(id);
        return goal != null ? ResponseEntity.ok(goal) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateGoal(@PathVariable String id, @RequestBody Goal goal) throws InterruptedException, ExecutionException {
        String message = goalService.updateGoal(id, goal);
        return ResponseEntity.ok(message);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteGoal(@PathVariable String id) throws InterruptedException, ExecutionException {
        String message = goalService.deleteGoal(id);
        return ResponseEntity.ok(message);
    }
}
