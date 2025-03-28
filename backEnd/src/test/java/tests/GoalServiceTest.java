package tests;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Goal;
import example.com.budgetTracker.service.GoalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GoalServiceTest {

    private Firestore firestore;
    private GoalService goalService;
    private CollectionReference goalsCollection;
    private DocumentReference docRef;
    private DocumentSnapshot snapshot;
    private ApiFuture<WriteResult> writeFuture;
    private ApiFuture<DocumentSnapshot> getFuture;
    private ApiFuture<QuerySnapshot> queryFuture;

    @BeforeEach
    void setup() {
        firestore = mock(Firestore.class);
        goalsCollection = mock(CollectionReference.class);
        docRef = mock(DocumentReference.class);
        snapshot = mock(DocumentSnapshot.class);
        writeFuture = mock(ApiFuture.class);
        getFuture = mock(ApiFuture.class);
        queryFuture = mock(ApiFuture.class);
        goalService = new GoalService(firestore);
    }

    @Test
    void testAddGoal_Success() throws Exception {
        Goal goal = new Goal();
        goal.setUserId("user123");

        when(firestore.collection("goals")).thenReturn(goalsCollection);
        when(goalsCollection.document()).thenReturn(docRef);
        when(docRef.set(any(Goal.class))).thenReturn(writeFuture);
        when(writeFuture.get()).thenReturn(null); // No need to mock final class

        String result = goalService.addGoal(goal);
        assertTrue(result.contains("unknown") || result.contains("at:"));
        verify(docRef).set(goal);
    }

    @Test
    void testGetAllGoals_ReturnsGoals() throws Exception {
        String uid = "user123";
        Query query = mock(Query.class);
        QuerySnapshot querySnapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot doc1 = mock(QueryDocumentSnapshot.class);

        Goal mockGoal = new Goal();
        mockGoal.setUserId(uid);

        when(firestore.collection("goals")).thenReturn(goalsCollection);
        when(goalsCollection.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.get()).thenReturn(queryFuture);
        when(queryFuture.get()).thenReturn(querySnapshot);
        when(querySnapshot.getDocuments()).thenReturn(List.of(doc1));
        when(doc1.toObject(Goal.class)).thenReturn(mockGoal);
        when(doc1.getId()).thenReturn("goal123");

        List<Goal> goals = goalService.getAllGoals(uid);
        assertEquals(1, goals.size());
        assertEquals("goal123", goals.get(0).getId());
    }

    @Test
    void testGetGoalById_Success() throws Exception {
        String uid = "user123";
        String goalId = "goal456";
        Goal goal = new Goal();
        goal.setUserId(uid);

        when(firestore.collection("goals")).thenReturn(goalsCollection);
        when(goalsCollection.document(goalId)).thenReturn(docRef);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Goal.class)).thenReturn(goal);
        when(snapshot.getId()).thenReturn(goalId);

        Goal result = goalService.getGoalById(goalId, uid);
        assertEquals(goalId, result.getId());
    }

    @Test
    void testGetGoalById_Unauthorised() throws Exception {
        String uid = "user123";
        String goalId = "goal789";
        Goal goal = new Goal();
        goal.setUserId("otherUser");

        when(firestore.collection("goals")).thenReturn(goalsCollection);
        when(goalsCollection.document(goalId)).thenReturn(docRef);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Goal.class)).thenReturn(goal);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> {
            goalService.getGoalById(goalId, uid);
        });
        assertTrue(ex.getMessage().contains("Unauthorized"));
    }

    @Test
    void testUpdateGoal_Success() throws Exception {
        String uid = "user123";
        String goalId = "goal999";

        Goal existing = new Goal();
        existing.setUserId(uid);

        Goal updated = new Goal();
        updated.setGoal("New Goal");
        updated.setAllocatedFunds(200);
        updated.setTargetAmount(1000);

        when(firestore.collection("goals")).thenReturn(goalsCollection);
        when(goalsCollection.document(goalId)).thenReturn(docRef);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Goal.class)).thenReturn(existing);
        when(docRef.set(any(Goal.class))).thenReturn(writeFuture);
        when(writeFuture.get()).thenReturn(null); // ✅ Avoid mocking WriteResult

        String result = goalService.updateGoal(goalId, updated, uid);

        assertNotNull(result);
        assertEquals("unknown", result); // since we're simulating a null WriteResult
    }


    @Test
    void testDeleteGoal_Success() throws Exception {
        String uid = "user123";
        String goalId = "goal321";
        Goal goal = new Goal();
        goal.setUserId(uid);

        ApiFuture<WriteResult> deleteFuture = mock(ApiFuture.class);

        when(firestore.collection("goals")).thenReturn(goalsCollection);
        when(goalsCollection.document(goalId)).thenReturn(docRef);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Goal.class)).thenReturn(goal);
        when(docRef.delete()).thenReturn(deleteFuture);
        when(deleteFuture.get()).thenReturn(null); // ✅ null is fine

        String result = goalService.deleteGoal(goalId, uid);

        assertNotNull(result);
        assertEquals("unknown", result); // ✅ Expect fallback
    }


    @Test
    void testDeleteAllGoals_Success() throws Exception {
        String uid = "user123";
        Query query = mock(Query.class);
        QuerySnapshot querySnapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot doc1 = mock(QueryDocumentSnapshot.class);
        ApiFuture<WriteResult> deleteFuture = mock(ApiFuture.class);

        when(firestore.collection("goals")).thenReturn(goalsCollection);
        when(goalsCollection.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.get()).thenReturn(queryFuture);
        when(queryFuture.get()).thenReturn(querySnapshot);
        when(querySnapshot.getDocuments()).thenReturn(List.of(doc1));
        when(doc1.getReference()).thenReturn(docRef);
        when(docRef.delete()).thenReturn(deleteFuture);
        when(deleteFuture.get()).thenReturn(null);

        String result = goalService.deleteAllGoals(uid);
        assertTrue(result.contains("All goals deleted successfully"));
    }
}

