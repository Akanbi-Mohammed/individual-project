package tests;

import example.com.budgetTracker.model.RecurringExpense;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class RecurringExpenseTest {

    @Test
    void testDefaultConstructorAndSetters() {
        RecurringExpense rec = new RecurringExpense();

        Date start = new Date();
        Date end = new Date();

        rec.setId("rec123");
        rec.setUserId("user123");
        rec.setDescription("Netflix Subscription");
        rec.setCategory("Entertainment");
        rec.setAmount(15.99);
        rec.setFrequency("monthly");
        rec.setBillingDay(10);
        rec.setStartDate(start);
        rec.setEndDate(end);
        rec.setActive(true);

        assertEquals("rec123", rec.getId());
        assertEquals("user123", rec.getUserId());
        assertEquals("Netflix Subscription", rec.getDescription());
        assertEquals("Entertainment", rec.getCategory());
        assertEquals(15.99, rec.getAmount());
        assertEquals("monthly", rec.getFrequency());
        assertEquals(10, rec.getBillingDay());
        assertEquals(start, rec.getStartDate());
        assertEquals(end, rec.getEndDate());
        assertTrue(rec.isActive());
    }

    @Test
    void testFullConstructor() {
        Date start = new Date();
        Date end = new Date();

        RecurringExpense rec = new RecurringExpense(
                "user456",
                "Gym Membership",
                "Fitness",
                25.00,
                "monthly",
                5,
                start,
                end,
                false
        );

        assertNull(rec.getId()); // not set in constructor
        assertEquals("user456", rec.getUserId());
        assertEquals("Gym Membership", rec.getDescription());
        assertEquals("Fitness", rec.getCategory());
        assertEquals(25.00, rec.getAmount());
        assertEquals("monthly", rec.getFrequency());
        assertEquals(5, rec.getBillingDay());
        assertEquals(start, rec.getStartDate());
        assertEquals(end, rec.getEndDate());
        assertFalse(rec.isActive());
    }
}
