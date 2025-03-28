package tests;

import example.com.budgetTracker.model.Category;
import org.junit.jupiter.api.Test;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CategoryTest {

    @Test
    void testDefaultConstructorAndSetters() {
        Category category = new Category();
        category.setUserId("user123");
        category.setCategories(List.of("Food", "Travel"));

        assertEquals("user123", category.getUserId());
        assertEquals(2, category.getCategories().size());
        assertTrue(category.getCategories().contains("Food"));
    }

    @Test
    void testAllArgsConstructor() {
        Category category = new Category("user456", List.of("Bills", "Entertainment"));

        assertEquals("user456", category.getUserId());
        assertEquals(List.of("Bills", "Entertainment"), category.getCategories());
    }
}
