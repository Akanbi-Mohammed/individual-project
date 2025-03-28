package example.com.budgetTracker.scheduler;

import example.com.budgetTracker.service.RecurringExpenseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class RecurringExpenseScheduler {
    private static final Logger logger = LoggerFactory.getLogger(RecurringExpenseScheduler.class);

    private final RecurringExpenseService recurringExpenseService;

    @Autowired
    public RecurringExpenseScheduler(RecurringExpenseService recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }

    // Schedule to run daily at midnight (server's local time)
    @Scheduled(cron = "0 0 0 * * ?")
    public void scheduledSyncRecurringExpenses() {
        try {
            recurringExpenseService.syncAllRecurringExpenses();
            logger.info("Scheduled recurring expenses sync completed successfully.");
        } catch (Exception e) {
            logger.error("Error during scheduled recurring expenses sync: ", e);
        }
    }
}
