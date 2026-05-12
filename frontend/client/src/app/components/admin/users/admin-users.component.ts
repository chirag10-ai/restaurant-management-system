import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { UserService, User } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        // Apply the rule: only show admin users and the original/main admin
        // Map users to ensure consistent ID property
        this.users = users.map(user => ({
          ...user,
          id: user._id || user.id // Ensure consistent ID property
        }));
        
        // Show all users to admin (customers, managers, and admins)
        this.filteredUsers = this.users;
        
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching users:', err);
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  toggleUserStatus(userId: string): void {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex].isActive = !this.users[userIndex].isActive;
    }
  }

  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users = this.users.filter(user => user.id !== userId);
    }
  }

  getUserRoleClass(role: string): string {
    switch(role.toLowerCase()) {
      case 'admin':
        return 'role-admin';
      case 'manager':
        return 'role-manager';
      case 'customer':
        return 'role-customer';
      default:
        return '';
    }
  }
}