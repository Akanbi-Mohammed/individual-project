package tests;

import example.com.budgetTracker.controller.IncomeController;
import example.com.budgetTracker.model.Income;
import example.com.budgetTracker.service.IncomeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncomeControllerTest {

    @InjectMocks
    private IncomeController incomeController;

    @Mock
    private IncomeService incomeService;

    private final String uid = "user123";

    @BeforeEach
    void setup() {
        incomeController = Mockito.spy(new IncomeController());
        ReflectionTestUtils.setField(incomeController, "incomeService", incomeService);
        doReturn(uid).when(incomeController).getUidFromAuthorization(anyString());
    }

    @Test
    void testUpdateIncome_Success() throws Exception {
        Income income = new Income();
        income.setMonth("March");
        income.setAmount(1000.0);

        doNothing().when(incomeService).updateIncome(any(Income.class));

        ResponseEntity<String> response = incomeController.updateIncome("Bearer faketoken", income);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Income updated successfully.", response.getBody());
        verify(incomeService).updateIncome(any(Income.class));
    }

    @Test
    void testUpdateIncome_Failure() throws Exception {
        Income income = new Income();
        income.setMonth("March");
        income.setAmount(1000.0);

        doThrow(new ExecutionException(new RuntimeException("fail")))
                .when(incomeService).updateIncome(any());

        ResponseEntity<String> response = incomeController.updateIncome("Bearer faketoken", income);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().contains("Error updating income"));
    }

    @Test
    void testGetIncome_Success() throws Exception {
        Income income = new Income();
        income.setMonth("March");
        income.setAmount(1500.0);

        when(incomeService.getIncome(uid, "March")).thenReturn(income);

        ResponseEntity<Income> response = incomeController.getIncome("Bearer faketoken", "March");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1500.0, response.getBody().getAmount());
        verify(incomeService).getIncome(uid, "March");
    }

    @Test
    void testGetIncome_Failure() throws Exception {
        when(incomeService.getIncome(uid, "March"))
                .thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<Income> response = incomeController.getIncome("Bearer faketoken", "March");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNull(response.getBody());
    }
}
