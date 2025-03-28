package tests;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.*;
import java.util.concurrent.ExecutionException;

class CategoryServiceTest {

    private Firestore firestore;
    private CategoryService categoryService;
    private DocumentReference docRef;
    private CollectionReference categoriesCollection;

    // Mocks for budgets and expenses (for renameCategory and deleteCategoryByName)
    private CollectionReference budgetsCollection;
    private CollectionReference expensesCollection;
    private WriteBatch batch;
    private ApiFuture<QuerySnapshot> queryFuture;
    private QuerySnapshot querySnapshot;

    @BeforeEach
    void setup() {
        firestore = mock(Firestore.class);
        categoryService = new CategoryService(firestore);

        // For categories
        docRef = mock(DocumentReference.class);
        categoriesCollection = mock(CollectionReference.class);
        when(firestore.collection("categories")).thenReturn(categoriesCollection);

        // For budgets and expenses
        budgetsCollection = mock(CollectionReference.class);
        expensesCollection = mock(CollectionReference.class);
        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(firestore.collection("expenses")).thenReturn(expensesCollection);

        // Common batch mocks for updates/deletions in rename/delete methods
        batch = mock(WriteBatch.class);
        when(firestore.batch()).thenReturn(batch);
        // Let batch.commit() return a future that yields a null result list (we don't care)
        ApiFuture<List<WriteResult>> batchFuture = mock(ApiFuture.class);
        when(batch.commit()).thenReturn(batchFuture);
        try {
            when(batchFuture.get()).thenReturn(null);
        } catch (Exception e) {
            fail("Unexpected exception in setup: " + e.getMessage());
        }

        // Query future and snapshot for budgets/expenses queries:
        queryFuture = mock(ApiFuture.class);
        querySnapshot = mock(QuerySnapshot.class);
    }

    // Test getCategories: first time user (document does not exist)
    @Test
    void testGetCategories_FirstTimeUser() throws ExecutionException, InterruptedException {
        String uid = "user123";
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        ApiFuture<WriteResult> writeFuture = mock(ApiFuture.class);

        when(categoriesCollection.document(uid)).thenReturn(docRef);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);
        // Document does not exist, so defaults will be applied.
        when(snapshot.exists()).thenReturn(false);
        when(docRef.set(anyMap(), eq(SetOptions.merge()))).thenReturn(writeFuture);
        when(writeFuture.get()).thenReturn(null);

        List<String> result = categoryService.getCategories(uid);

        // Expect all default categories to be present
        assertTrue(result.contains("Groceries"));
        assertTrue(result.contains("School Fees"));
        // Verify that the categories were written back
        verify(docRef).set(anyMap(), eq(SetOptions.merge()));
    }

    // Test updateCategories: removes duplicates and blanks
    @Test
    void testUpdateCategories_RemovesDuplicatesAndBlanks() throws ExecutionException, InterruptedException {
        String uid = "user123";
        ApiFuture<WriteResult> future = mock(ApiFuture.class);

        when(categoriesCollection.document(uid)).thenReturn(docRef);
        when(docRef.set(anyMap(), eq(SetOptions.merge()))).thenReturn(future);
        when(future.get()).thenReturn(null);

        List<String> input = Arrays.asList("Food", "", "Food", null, "Bills");
        categoryService.updateCategories(uid, input);

        verify(docRef).set(argThat(map -> {
            List<String> cats = (List<String>) map.get("categories");
            return cats.size() == 2 && cats.contains("Food") && cats.contains("Bills");
        }), eq(SetOptions.merge()));
    }

    // Test renameCategory: successful renaming and triggers budgets/expenses updates
    @Test
    void testRenameCategory_Success() throws ExecutionException, InterruptedException {
        String uid = "user123";
        String oldCategory = "Old";
        String newCategory = "New";
        // Create a document snapshot that exists and has a list of categories
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        List<String> categories = new ArrayList<>(Arrays.asList("Old", "Extra"));
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.get("categories")).thenReturn(categories);

        when(categoriesCollection.document(uid)).thenReturn(docRef);
        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);

        // For the update on categories document
        ApiFuture<WriteResult> updateFuture = mock(ApiFuture.class);
        when(docRef.update(eq("categories"), any())).thenReturn(updateFuture);
        when(updateFuture.get()).thenReturn(null);

        // For budgets update: simulate an empty list of documents (or you can simulate one)
        Query budgetsQuery = mock(Query.class);
        when(budgetsCollection.whereEqualTo("userId", uid)).thenReturn(budgetsQuery);
        Query budgetsQuery2 = mock(Query.class);
        when(budgetsQuery.whereEqualTo("category", oldCategory)).thenReturn(budgetsQuery2);
        when(budgetsQuery2.get()).thenReturn(queryFuture);
        when(queryFuture.get()).thenReturn(querySnapshot);
        when(querySnapshot.getDocuments()).thenReturn(Collections.emptyList());

        // For expenses update: simulate an empty list of documents
        Query expensesQuery = mock(Query.class);
        when(expensesCollection.whereEqualTo("userId", uid)).thenReturn(expensesQuery);
        Query expensesQuery2 = mock(Query.class);
        when(expensesQuery.whereEqualTo("category", oldCategory)).thenReturn(expensesQuery2);
        when(expensesQuery2.get()).thenReturn(queryFuture);
        when(queryFuture.get()).thenReturn(querySnapshot);
        when(querySnapshot.getDocuments()).thenReturn(Collections.emptyList());

        // Execute renameCategory method
        categoryService.renameCategory(uid, oldCategory, newCategory);

        // Verify the update was called with a list containing new category and not the old one.
        ArgumentCaptor<List> captor = ArgumentCaptor.forClass(List.class);
        verify(docRef).update(eq("categories"), captor.capture());
        List<String> updatedCats = captor.getValue();
        assertTrue(updatedCats.contains(newCategory));
        assertFalse(updatedCats.contains(oldCategory));
    }

    // Test renameCategory error: if new category equals old category (ignoring case)
    @Test
    void testRenameCategory_SameNameThrowsException() {
        String uid = "user123";
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                categoryService.renameCategory(uid, "Food", "food")
        );
        assertEquals("New category name must be different.", exception.getMessage());
    }

    // Test renameCategory error: if document doesn't exist
    @Test
    void testRenameCategory_DocumentNotFound() throws ExecutionException, InterruptedException {
        String uid = "user123";
        when(categoriesCollection.document(uid)).thenReturn(docRef);
        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        when(docRef.get()).thenReturn(getFuture);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                categoryService.renameCategory(uid, "Old", "New")
        );
        assertEquals("No categories found for user: " + uid, exception.getMessage());
    }

    // Test renameCategory error: if category to rename is not found
    @Test
    void testRenameCategory_CategoryNotFound() throws ExecutionException, InterruptedException {
        String uid = "user123";
        when(categoriesCollection.document(uid)).thenReturn(docRef);
        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        when(docRef.get()).thenReturn(getFuture);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        // Return a list without the old category
        when(snapshot.get("categories")).thenReturn(new ArrayList<>(List.of("Extra")));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                categoryService.renameCategory(uid, "Old", "New")
        );
        assertEquals("Category 'Old' not found.", exception.getMessage());
    }

    // Test deleteCategoryByName: successful deletion
    @Test
    void testDeleteCategoryByName_Success() throws ExecutionException, InterruptedException {
        String uid = "user123";
        String categoryName = "Groceries";

        // Create a snapshot that exists with a list containing the category
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        List<String> categories = new ArrayList<>(List.of("Groceries", "Bills"));
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.get("categories")).thenReturn(categories);

        when(categoriesCollection.document(uid)).thenReturn(docRef);
        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);
        // For updating categories document
        ApiFuture<WriteResult> updateFuture = mock(ApiFuture.class);
        when(docRef.update(eq("categories"), any())).thenReturn(updateFuture);
        when(updateFuture.get()).thenReturn(null);

        // For deletion of budgets and expenses, simulate empty query results
        Query budgetsQuery = mock(Query.class);
        when(budgetsCollection.whereEqualTo("userId", uid)).thenReturn(budgetsQuery);
        Query budgetsQuery2 = mock(Query.class);
        when(budgetsQuery.whereEqualTo("category", categoryName)).thenReturn(budgetsQuery2);
        ApiFuture<QuerySnapshot> budgetsFuture = mock(ApiFuture.class);
        when(budgetsQuery2.get()).thenReturn(budgetsFuture);
        QuerySnapshot budgetsSnapshot = mock(QuerySnapshot.class);
        when(budgetsFuture.get()).thenReturn(budgetsSnapshot);
        when(budgetsSnapshot.getDocuments()).thenReturn(Collections.emptyList());

        Query expensesQuery = mock(Query.class);
        when(expensesCollection.whereEqualTo("userId", uid)).thenReturn(expensesQuery);
        Query expensesQuery2 = mock(Query.class);
        when(expensesQuery.whereEqualTo("category", categoryName)).thenReturn(expensesQuery2);
        ApiFuture<QuerySnapshot> expensesFuture = mock(ApiFuture.class);
        when(expensesQuery2.get()).thenReturn(expensesFuture);
        QuerySnapshot expensesSnapshot = mock(QuerySnapshot.class);
        when(expensesFuture.get()).thenReturn(expensesSnapshot);
        when(expensesSnapshot.getDocuments()).thenReturn(Collections.emptyList());

        String result = categoryService.deleteCategoryByName(uid, categoryName);
        assertEquals("Category '" + categoryName + "' and all related budgets/expenses deleted successfully.", result);

        // Verify update was called on the categories document
        verify(docRef).update(eq("categories"), any());
    }

    // Test deleteCategoryByName: error if document does not exist
    @Test
    void testDeleteCategoryByName_DocumentNotFound() throws ExecutionException, InterruptedException {
        String uid = "user123";
        when(categoriesCollection.document(uid)).thenReturn(docRef);
        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        when(docRef.get()).thenReturn(getFuture);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                categoryService.deleteCategoryByName(uid, "Groceries")
        );
        assertEquals("No categories found for user: " + uid, exception.getMessage());
    }

    // Test deleteCategoryByName: error if category not found in document
    @Test
    void testDeleteCategoryByName_CategoryNotFound() throws ExecutionException, InterruptedException {
        String uid = "user123";
        when(categoriesCollection.document(uid)).thenReturn(docRef);
        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        when(docRef.get()).thenReturn(getFuture);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        // Return a list that does not contain the category
        when(snapshot.get("categories")).thenReturn(new ArrayList<>(List.of("Bills", "Rent")));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                categoryService.deleteCategoryByName(uid, "Groceries")
        );
        assertEquals("Category 'Groceries' not found.", exception.getMessage());
    }

    // Test deleteAllCategories: successful deletion
    @Test
    void testDeleteAllCategories() throws ExecutionException, InterruptedException {
        String uid = "user123";
        ApiFuture<WriteResult> deleteFuture = mock(ApiFuture.class);

        when(categoriesCollection.document(uid)).thenReturn(docRef);
        when(docRef.delete()).thenReturn(deleteFuture);
        when(deleteFuture.get()).thenReturn(null);

        String result = categoryService.deleteAllCategories(uid);
        assertEquals("All categories deleted.", result);
    }
}
