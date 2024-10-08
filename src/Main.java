public class Main {
    public static void main(String[] args) {
        // Create an array of integers
        int[] numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

        // Variable to store the sum of even numbers
        int sumOfEvens = 0;

        // Loop through the array
        for (int number : numbers) {
            // Check if the number is even
            if (number % 2 == 0) {
                sumOfEvens += number;  // Add the even number to the sum
            }
        }

        // Print the result
        System.out.println("The sum of all even numbers is: " + sumOfEvens);
    }
}
