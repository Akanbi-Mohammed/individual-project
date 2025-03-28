package tests;

import example.com.budgetTracker.model.Goal;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GoalTest {

    @Test
    void testDefaultConstructorAndSetters() {
        Goal goal = new Goal();

        goal.setId("goal1");
        goal.setUserId("user123");
        goal.setGoal("Save for trip");
        goal.setTargetAmount(1000.0);
        goal.setAllocatedFunds(200.0);
        goal.setDeadline("2025-06-30");

        assertEquals("goal1", goal.getId());
        assertEquals("user123", goal.getUserId());
        assertEquals("Save for trip", goal.getGoal());
        assertEquals(1000.0, goal.getTargetAmount());
        assertEquals(200.0, goal.getAllocatedFunds());
        assertEquals("2025-06-30", goal.getDeadline());
    }

    @Test
    void testAllArgsConstructor() {
        Goal goal = new Goal("user456", "Buy car", 5000.0, 1200.0, "2025-12-01");

        assertNull(goal.getId()); // Not set in constructor
        assertEquals("user456", goal.getUserId());
        assertEquals("Buy car", goal.getGoal());
        assertEquals(5000.0, goal.getTargetAmount());
        assertEquals(1200.0, goal.getAllocatedFunds());
        assertEquals("2025-12-01", goal.getDeadline());
    }
}
