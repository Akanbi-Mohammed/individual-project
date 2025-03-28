package example.com.budgetTracker.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void init() {
        try {
            // Retrieve the file path from the environment variable
            String credentialPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
            if (credentialPath == null || credentialPath.isEmpty()) {
                throw new IllegalStateException("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set!");
            }
            InputStream serviceAccount = new FileInputStream(credentialPath);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setDatabaseUrl("https://level4-project-default-rtdb.firebaseio.com/")
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (IOException e) {
            e.printStackTrace();
            // Optionally rethrow or handle the exception as needed
        }
    }

    // Firestore bean to interact with Firestore database
    @Bean
    public Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }
}
