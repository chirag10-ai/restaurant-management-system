import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService } from '../../services/contact.service';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  contactForm: FormGroup;
  submitted = false;
  successMessage = '';

  ngOnInit(): void {
    console.log('Contact component initialized');
    
    // Add input validation for phone number
    this.contactForm.get('phone')?.valueChanges.subscribe(value => {
      if (value && value.length > 10) {
        // Truncate to 10 digits
        this.contactForm.get('phone')?.setValue(value.substring(0, 10), { emitEvent: false });
      }
      // Remove any non-digit characters
      if (value && !/^[0-9]*$/.test(value)) {
        this.contactForm.get('phone')?.setValue(value.replace(/[^0-9]/g, ''), { emitEvent: false });
      }
    });
  }

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService
  ) {
    this.contactForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.submitted = true;
      
      this.contactService.sendMessage(this.contactForm.value).subscribe({
        next: (response) => {
          this.successMessage = response.message;
          
          // Reset form after submission
          setTimeout(() => {
            this.contactForm.reset();
            this.submitted = false;
            this.successMessage = '';
          }, 5000);
        },
        error: (error) => {
          console.error('Error sending message:', error);
          this.successMessage = 'Sorry, there was an error sending your message. Please try again.';
          this.submitted = false;
        }
      });
    }
  }
}