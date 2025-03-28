package example.com.budgetTracker.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import example.com.budgetTracker.model.Goal;
import example.com.budgetTracker.service.GoalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/goals")
@CrossOrigin(origins = "https://level4-project.web.app")
public class GoalController {

    @Autowired
    private GoalService goalService;

    /**
     * Extracts the UID from the Authorization header using Firebase Admin.
     * Expects the header to be in the format "Bearer <token>".
     */
    public String getUidFromAuthorization(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(token);
                return decodedToken.getUid();
            } catch (Exception e) {
                throw new ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid token", e
                );
            }
        }
        throw new ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header"
        );
    }

    // Add a new goal for the authenticated user
    @PostMapping
    public ResponseEntity<String> addGoal(@RequestHeader("Authorization") String authHeader,
                                          @RequestBody Goal goal) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            // Associate the goal with the authenticated user
            goal.setUserId(uid);
            String message = goalService.addGoal(goal);
            return ResponseEntity.ok(message);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error adding goal: " + e.getMessage());
        }
    }

    // Get all goals for the authenticated user
    @GetMapping
    public ResponseEntity<List<Goal>> getAllGoals(@RequestHeader("Authorization") String authHeader) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            List<Goal> goals = goalService.getAllGoals(uid);
            return ResponseEntity.ok(goals);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // Get a specific goal by ID for the authenticated user
    @GetMapping("/{id}")
    public ResponseEntity<Goal> getGoalById(@RequestHeader("Authorization") String authHeader,
                                            @PathVariable String id) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            Goal goal = goalService.getGoalById(id, uid);
            return ResponseEntity.ok(goal);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    // Update a goal by ID for the authenticated user
    @PutMapping("/{id}")
    public ResponseEntity<String> updateGoal(@RequestHeader("Authorization") String authHeader,
                                             @PathVariable String id,
                                             @RequestBody Goal goal) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            String message = goalService.updateGoal(id, goal, uid);
            return ResponseEntity.ok(message);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating goal: " + e.getMessage());
        }
    }

    // Delete a goal by ID for the authenticated user
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteGoal(@RequestHeader("Authorization") String authHeader,
                                             @PathVariable String id) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            String message = goalService.deleteGoal(id, uid);
            return ResponseEntity.ok(message);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error deleting goal: " + e.getMessage());
        }
    }
    @DeleteMapping("/delete-all")
    public ResponseEntity<String> deleteAllGoals(@RequestHeader("Authorization") String authHeader) {
        try {
            String uid = getUidFromAuthorization(authHeader);
            String response = goalService.deleteAllGoals(uid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting goals: " + e.getMessage());
        }
    }
}
