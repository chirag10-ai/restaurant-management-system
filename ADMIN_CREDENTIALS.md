    # Admin Panel Credentials

## Special Admin Login

The restaurant management system includes special admin credentials that provide direct access to the admin panel:

- **Username/Email**: `admin@gmail.com`
- **Password**: `admin@123`

## Purpose

These credentials are specifically designed to:
- Provide guaranteed access to the admin panel
- Serve as test credentials during development
- Ensure admin functionality is always accessible regardless of database state

## Security Implementation

- The credentials are handled in the backend authentication system
- When these specific credentials are used, the system bypasses normal database lookup
- A special admin session is created with admin privileges
- The credentials are only valid for admin panel access, not for regular user accounts

## Backend Handling

In `backend/routes/auth.js`, there is special logic to recognize these credentials and grant admin access without checking against stored user records.

## Usage

These credentials can be used to log into the admin panel at `/login`. Upon successful authentication, the user will be redirected to the admin dashboard based on their admin role.