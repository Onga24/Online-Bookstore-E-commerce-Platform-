import { AbstractControl } from '@angular/forms';

export const PasswordMatchValidator = (
  passwordControllName: string,
  confirmPasswordControllName: string
) => {
  return (form: AbstractControl) => {
    const passwordControl = form.get(passwordControllName);
    const confirmPasswordControl = form.get(confirmPasswordControllName);

    if (!passwordControl || !confirmPasswordControl) return null;

    if (passwordControl.value !== confirmPasswordControl.value) {
      confirmPasswordControl.setErrors({ notMatch: true });
      return { notMatch: true };
    } else {
      if (confirmPasswordControl.errors) {
        delete confirmPasswordControl.errors['notMatch'];
        if (Object.keys(confirmPasswordControl.errors).length === 0) {
          confirmPasswordControl.setErrors(null);
        }
      }
    }

    return null;
  };
};
