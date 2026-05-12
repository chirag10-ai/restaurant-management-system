import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuService, MenuItem } from '../../../services/menu.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-menu.component.html',
  styleUrls: ['./admin-menu.component.css']
})
export class AdminMenuComponent implements OnInit {
  menuForm: FormGroup;
  menuItems: MenuItem[] = [];
  editingItem: MenuItem | null = null;
  showForm = false;
  loading = false;
  selectedFile: File | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private menuService: MenuService,
    public authService: AuthService
  ) {
    this.menuForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      image: [''],
      isAvailable: ['true', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if user is authenticated as admin
    if (!this.authService.isAuthenticated()) {
      console.error('User not authenticated');
      alert('Please log in as admin to manage menu items');
      return;
    }
    
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      console.error('User is not admin:', user);
      alert('Access denied. Admin privileges required.');
      return;
    }
    
    console.log('Admin user authenticated:', user);
    this.loadMenuItems();
  }

  loadMenuItems(): void {
    this.loading = true;
    this.menuService.getAllMenuItems().subscribe({
      next: (items) => {
        this.menuItems = items;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
        this.loading = false;
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.cancelEdit();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // For now, we'll just store the file name as the image value
      // In a real application, you would upload the file to a server
      this.menuForm.patchValue({
        image: file.name
      });
    }
  }

  getImageUrl(imagePath: string): string {
    // If the image path is already a full URL, return it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // If it's a relative path, prepend the backend URL
    return `http://localhost:5000${imagePath}`;
  }

  submitForm(): void {
    if (this.menuForm.valid) {
      // Convert isAvailable string to boolean
      const formData = {
        ...this.menuForm.value,
        isAvailable: this.menuForm.value.isAvailable === 'true'
      };
      
      if (this.editingItem) {
        // Update existing item
        this.menuService.updateMenuItem(this.editingItem._id!, formData).subscribe({
          next: (updatedItem) => {
            const index = this.menuItems.findIndex(item => item._id === this.editingItem!._id);
            if (index !== -1) {
              this.menuItems[index] = updatedItem;
            }
            this.cancelEdit();
          },
          error: (error) => {
            console.error('Error updating menu item:', error);
          }
        });
      } else {
        // Add new item
        const formData = new FormData();
        const menuItemData = {
          ...this.menuForm.value,
          isAvailable: this.menuForm.value.isAvailable === 'true'
        };
        
        // Add form data
        Object.keys(menuItemData).forEach(key => {
          formData.append(key, menuItemData[key]);
        });
        
        // Add file if selected
        if (this.selectedFile) {
          formData.append('image', this.selectedFile, this.selectedFile.name);
        }
        
        this.menuService.createMenuItem(formData).subscribe({
          next: (newItem) => {
            // Add to the beginning of the list for better UX
            this.menuItems.unshift(newItem);
            this.menuForm.reset({
              isAvailable: true
            });
            this.selectedFile = null;
            this.showForm = false;
            alert(`Successfully added "${newItem.name}" to the menu!`);
          },
          error: (error) => {
            console.error('Error creating menu item:', error);
            let errorMessage = 'Failed to add menu item.';
            if (error.error && error.error.message) {
              errorMessage += ' ' + error.error.message;
            } else if (error.message) {
              errorMessage += ' ' + error.message;
            }
            alert(errorMessage + ' Please try again.');
          }
        });
      }
    }
  }

  editItem(item: MenuItem): void {
    this.editingItem = item;
    this.showForm = true;
    this.menuForm.patchValue({
      ...item,
      isAvailable: item.isAvailable ? 'true' : 'false'
    });
  }

  deleteItem(id: string): void {
    if (confirm('Are you sure you want to delete this menu item?')) {
      this.menuService.deleteMenuItem(id).subscribe({
        next: () => {
          this.menuItems = this.menuItems.filter(item => item._id !== id);
        },
        error: (error) => {
          console.error('Error deleting menu item:', error);
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingItem = null;
    this.menuForm.reset({
      isAvailable: 'true'
    });
    this.showForm = false;
  }

  toggleAvailability(item: MenuItem): void {
    this.menuService.toggleMenuItemAvailability(item._id!, item.isAvailable).subscribe({
      next: (updatedItem) => {
        const index = this.menuItems.findIndex(i => i._id === item._id);
        if (index !== -1) {
          this.menuItems[index] = updatedItem;
        }
      },
      error: (error) => {
        console.error('Error toggling availability:', error);
      }
    });
  }
}