import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function lowerCaseValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value && control.value !== control.value.toLowerCase()) {
      return { 'lowercase': 'Only lowercase letters are allowed.' };
    }
    return null;
  };
}
