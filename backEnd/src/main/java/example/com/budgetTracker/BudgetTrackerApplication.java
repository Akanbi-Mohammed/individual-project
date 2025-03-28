package example.com.budgetTracker;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.aspectj.EnableSpringConfigured;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BudgetTrackerApplication {
    public static void main(String[] args) {
        SpringApplication.run(BudgetTrackerApplication.class, args);
    }
}

