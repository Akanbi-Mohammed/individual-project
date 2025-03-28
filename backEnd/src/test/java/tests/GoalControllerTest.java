package tests;

import example.com.budgetTracker.controller.GoalController;
import example.com.budgetTracker.model.Goal;
import example.com.budgetTracker.service.GoalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class GoalControllerTest {

    private GoalController goalController;
    private GoalService goalService;

    @BeforeEach
    void setUp() {
        goalService = mock(GoalService.class);
        goalController = Mockito.spy(new GoalController());

        // Inject the mock service
        ReflectionTestUtils.setField(goalController, "goalService", goalService);

        // Mock token verification
        doReturn("user123").when(goalController).getUidFromAuthorization(anyString());
    }

    @Test
    void testAddGoal_Success() throws Exception {
        Goal goal = new Goal();
        when(goalService.addGoal(any(Goal.class))).thenReturn("Goal added successfully");

        ResponseEntity<String> response = goalController.addGoal("Bearer faketoken", goal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("Goal added successfully"));
        verify(goalService).addGoal(any(Goal.class));
    }

    @Test
    void testGetAllGoals_Success() throws Exception {
        when(goalService.getAllGoals("user123")).thenReturn(List.of());

        ResponseEntity<List<Goal>> response = goalController.getAllGoals("Bearer faketoken");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        verify(goalService).getAllGoals("user123");
    }

    @Test
    void testGetGoalById_Success() throws Exception {
        Goal goal = new Goal();
        when(goalService.getGoalById("goal1", "user123")).thenReturn(goal);

        ResponseEntity<Goal> response = goalController.getGoalById("Bearer faketoken", "goal1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(goal, response.getBody());
        verify(goalService).getGoalById("goal1", "user123");
    }

    @Test
    void testUpdateGoal_Success() throws Exception {
        Goal goal = new Goal();
        when(goalService.updateGoal(eq("goal1"), any(Goal.class), eq("user123")))
                .thenReturn("Goal updated successfully");

        ResponseEntity<String> response = goalController.updateGoal("Bearer faketoken", "goal1", goal);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("Goal updated successfully"));
    }

    @Test
    void testDeleteGoal_Success() throws Exception {
        when(goalService.deleteGoal("goal1", "user123")).thenReturn("Goal deleted successfully");

        ResponseEntity<String> response = goalController.deleteGoal("Bearer faketoken", "goal1");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("Goal deleted successfully"));
        verify(goalService).deleteGoal("goal1", "user123");
    }

    @Test
    void testDeleteAllGoals_Success() throws Exception {
        when(goalService.deleteAllGoals("user123")).thenReturn("All goals deleted successfully");

        ResponseEntity<String> response = goalController.deleteAllGoals("Bearer faketoken");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("All goals deleted successfully"));
        verify(goalService).deleteAllGoals("user123");
    }
}
