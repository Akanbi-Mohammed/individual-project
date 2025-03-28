FROM openjdk:17-jdk-slim

# Set the working directory
WORKDIR /app

# Copy the JAR file
ARG JAR_FILE=target/budget-tracker-backend-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} /app/app.jar

# Copy Firebase credentials
COPY ./src/main/resources/firebase/serviceAccountKey.json /app/serviceAccountKey.json

# Set environment variable so Java can find the file
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/serviceAccountKey.json"

# Expose port 8080
EXPOSE 8080

# Run the JAR file
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
