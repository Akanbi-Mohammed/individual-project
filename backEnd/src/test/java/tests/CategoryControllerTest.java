package tests;

import example.com.budgetTracker.controller.CategoryController;
import example.com.budgetTracker.model.Category;
import example.com.budgetTracker.service.BudgetService;
import example.com.budgetTracker.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@org.junit.jupiter.api.extension.ExtendWith(MockitoExtension.class)
public class CategoryControllerTest {

    @InjectMocks
    private CategoryController categoryController;

    @Mock
    private CategoryService categoryService;

    @Mock
    private BudgetService budgetService;

    private final String uid = "user123";

    @BeforeEach
    void setup() {
        categoryController = Mockito.spy(new CategoryController());
        ReflectionTestUtils.setField(categoryController, "categoryService", categoryService);
        ReflectionTestUtils.setField(categoryController, "budgetService", budgetService);
        doReturn(uid).when(categoryController).getUidFromAuthorization(anyString());
    }

    @Test
    void testGetCategories_Success() throws Exception {
        when(categoryService.getCategories(uid)).thenReturn(List.of("Food", "Travel"));

        ResponseEntity<?> response = categoryController.getCategories("Bearer fake-token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Food"));
        verify(categoryService).getCategories(uid);
    }

    @Test
    void testGetCategories_Failure() throws Exception {
        when(categoryService.getCategories(uid)).thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<?> response = categoryController.getCategories("Bearer fake-token");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testUpdateBudgetCategory_Success() throws Exception {
        Map<String, String> payload = Map.of("oldCategory", "Food", "newCategory", "Dining");

        ResponseEntity<String> response = categoryController.updateBudgetCategory("Bearer token", payload);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("updated"));
        verify(budgetService).batchUpdateCategory(uid, "Food", "Dining");
    }

    @Test
    void testUpdateBudgetCategory_Failure() throws Exception {
        Map<String, String> payload = Map.of("oldCategory", "Food", "newCategory", "Dining");

        doThrow(new ExecutionException(new RuntimeException("fail")))
                .when(budgetService).batchUpdateCategory(uid, "Food", "Dining");

        ResponseEntity<String> response = categoryController.updateBudgetCategory("Bearer token", payload);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().contains("Error updating"));
    }

    @Test
    void testUpdateBudgetCategory_MissingFields() {
        Map<String, String> invalidPayload = Map.of("oldCategory", "Food"); // Missing newCategory

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () ->  categoryController.updateBudgetCategory("Bearer token", invalidPayload)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertTrue(exception.getReason().contains("Missing category values"));
    }


    @Test
    void testUpdateUserCategories_Success() throws Exception {
        Category request = new Category();
        request.setCategories(List.of("Food", "Bills", "Travel"));

        doNothing().when(categoryService).updateCategories(uid, request.getCategories());

        ResponseEntity<String> response = categoryController.updateUserCategories("Bearer token", request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("updated successfully"));
    }

    @Test
    void testUpdateUserCategories_Failure() throws Exception {
        Category request = new Category();
        request.setCategories(List.of("Food"));

        doThrow(new ExecutionException(new RuntimeException("fail")))
                .when(categoryService).updateCategories(uid, request.getCategories());

        ResponseEntity<String> response = categoryController.updateUserCategories("Bearer token", request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testDeleteAllCategories_Success() throws Exception {
        when(categoryService.deleteAllCategories(uid)).thenReturn("All deleted");

        ResponseEntity<String> response = categoryController.deleteAllCategories("Bearer token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("All deleted", response.getBody());
        verify(categoryService).deleteAllCategories(uid);
    }

    @Test
    void testDeleteAllCategories_Failure() throws Exception {
        when(categoryService.deleteAllCategories(uid)).thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<String> response = categoryController.deleteAllCategories("Bearer token");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testDeleteCategoryByName_Success() throws Exception {
        when(categoryService.deleteCategoryByName(uid, "Food")).thenReturn("Deleted category: Food");

        ResponseEntity<String> response = categoryController.deleteCategoryByName("Bearer token", "Food");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Deleted category: Food", response.getBody());
    }

    @Test
    void testDeleteCategoryByName_Failure() throws Exception {
        when(categoryService.deleteCategoryByName(uid, "Food"))
                .thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<String> response = categoryController.deleteCategoryByName("Bearer token", "Food");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().contains("Error deleting"));
    }
}
