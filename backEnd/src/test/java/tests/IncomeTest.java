package tests;



import example.com.budgetTracker.model.Income;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class IncomeTest {

    @Test
    void testDefaultConstructorAndSetters() {
        Income income = new Income();

        income.setUserId("user123");
        income.setMonth("2025-03");
        income.setAmount(2000.50);

        assertEquals("user123", income.getUserId());
        assertEquals("2025-03", income.getMonth());
        assertEquals(2000.50, income.getAmount());
    }

    @Test
    void testAllArgsConstructor() {
        Income income = new Income("user456", "2025-04", 1500.0);

        assertEquals("user456", income.getUserId());
        assertEquals("2025-04", income.getMonth());
        assertEquals(1500.0, income.getAmount());
    }

    @Test
    void testNegativeIncomeAllowed() {
        Income income = new Income("user999", "2025-01", -500.00);
        assertEquals(-500.00, income.getAmount());
    }
}
