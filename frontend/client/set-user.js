// This script sets a user in localStorage and then opens the app
const user = {
    _id: "123",
    id: "123",
    name: "Test User",
    email: "test@example.com",
    role: "user"
};

const token = "test-token-123";

localStorage.setItem('currentUser', JSON.stringify(user));
localStorage.setItem('token', token);

console.log('User set in localStorage:', user);
console.log('Token set in localStorage:', token);

// Open the app in a new window
window.open('http://localhost:4200', '_blank');