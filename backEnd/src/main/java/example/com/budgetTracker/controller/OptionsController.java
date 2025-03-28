package example.com.budgetTracker.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OptionsController {
    @RequestMapping(value = "/**", method = RequestMethod.OPTIONS)
    public void handleOptions() {
        // No implementation needed. The CORS configuration will add the necessary headers.
    }
}
