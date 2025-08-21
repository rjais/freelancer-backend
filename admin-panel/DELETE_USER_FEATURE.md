# Delete User Feature - Admin Panel

## Overview
A new "Delete User" button has been added to the admin panel that allows administrators to completely remove users and all their related data from the database. This is particularly useful for testing purposes, allowing you to reuse the same phone number for multiple manual verification submissions.

## Features

### Frontend Changes
- **New Delete Button**: Added a yellow "Delete User" button next to the "Approve" and "Reject" buttons in the verification review modal
- **Confirmation Dialog**: Shows a confirmation dialog before deletion to prevent accidental deletions
- **Success/Error Notifications**: Displays appropriate success or error messages after deletion attempts
- **Automatic Refresh**: Automatically refreshes the dashboard and verification lists after successful deletion

### Backend Changes
- **Comprehensive Deletion**: The delete operation removes the user and all related data:
  - User record
  - Verification records
  - Transaction records
  - Application records (where user is freelancer)
  - Message records (where user is sender or receiver)
  - Job records (updates client/freelancer references to null)

## How to Use

1. **Access Admin Panel**: Login to the admin panel with admin credentials
2. **Navigate to Pending Verifications**: Go to the "Pending Verifications" section
3. **Review User**: Click on a verification request to open the review modal
4. **Delete User**: Click the "Delete User" button (yellow button with trash icon)
5. **Confirm Deletion**: Confirm the deletion in the popup dialog
6. **Success**: The user and all related data will be removed from the database

## API Endpoints

### Delete User Endpoint
```
GET /api/admin/delete-user/:id
```

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "User and all related data deleted successfully"
}
```

## Security Features

- **Admin Authentication Required**: Only authenticated admin users can delete users
- **Confirmation Dialog**: Prevents accidental deletions
- **Comprehensive Cleanup**: Ensures no orphaned data remains in the database

## Testing Use Case

This feature is particularly useful for testing manual verification flows:

1. Submit a manual verification with a test phone number
2. Review and process the verification in the admin panel
3. Delete the user using the new delete button
4. Use the same phone number again for another test submission

## Technical Implementation

### Frontend (admin-script.js)
- `deleteUser()` function handles the deletion process
- Uses the existing notification system for user feedback
- Integrates with the existing modal system

### Backend (adminController.js)
- `deleteUser()` method in AdminController class
- Uses Promise.all() for efficient parallel deletion of related data
- Proper error handling and logging

### Database Cleanup
The deletion process removes data from the following collections:
- `users` - Main user record
- `verifications` - Verification records
- `transactions` - Transaction history
- `applications` - Job applications
- `messages` - Chat messages
- `jobs` - Job records (updates references)

## Notes

- **Irreversible Action**: Deletion is permanent and cannot be undone
- **Testing Only**: This feature should primarily be used for testing purposes
- **Production Use**: Exercise caution when using this feature in production environments
