package example.com.budgetTracker.model;

import java.util.List;

public class Category {
    private String userId;
    private List<String> categories;

    public Category() {}

    public Category(String userId, List<String> categories) {
        this.userId = userId;
        this.categories = categories;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories;
    }
}
