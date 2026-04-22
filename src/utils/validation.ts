/**
 * Validation utilities for authentication forms
 */

/**
 * Validate email format (RFC 5322 simplified)
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Requirements: Min 8 chars, 1 uppercase, 1 number, 1 special character
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password) {
    return {
      valid: false,
      errors: ['Password is required'],
    };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate student ID format
 * Must be exactly 5 numbers
 */
export function validateStudentId(studentId: string): {
  valid: boolean;
  error?: string;
} {
  if (!studentId) {
    return {
      valid: false,
      error: 'Student ID is required',
    };
  }

  // Must be exactly 5 digits (numbers only)
  const studentIdRegex = /^[0-9]{5}$/;

  if (!studentIdRegex.test(studentId)) {
    return {
      valid: false,
      error: 'Student ID must be exactly 5 numbers',
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validate name (first/last name)
 */
export function validateName(name: string, fieldName: string = 'Name'): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: `${fieldName} is required`,
    };
  }

  if (name.trim().length < 2) {
    return {
      valid: false,
      error: `${fieldName} must be at least 2 characters long`,
    };
  }

  if (name.trim().length > 50) {
    return {
      valid: false,
      error: `${fieldName} must be less than 50 characters`,
    };
  }

  // Allow only letters, hyphens, and spaces
  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    return {
      valid: false,
      error: `${fieldName} can only contain letters, hyphens, and spaces`,
    };
  }

  return {
    valid: true,
  };
}

/**
 * Validate form field
 */
export function validateField(
  value: string,
  fieldType: 'email' | 'password' | 'studentId' | 'name'
): {
  valid: boolean;
  error?: string;
} {
  switch (fieldType) {
    case 'email':
      return {
        valid: validateEmail(value),
        error: validateEmail(value) ? undefined : 'Invalid email address',
      };

    case 'password':
      const passwordValidation = validatePassword(value);
      return {
        valid: passwordValidation.valid,
        error: passwordValidation.errors.length > 0 ? passwordValidation.errors[0] : undefined,
      };

    case 'studentId':
      return validateStudentId(value);

    case 'name':
      return validateName(value);

    default:
      return { valid: true };
  }
}

/**
 * Validate signup form data
 */
export function validateSignupForm(data: {
  email: string;
  password: string;
  confirmPassword: string;
  studentId: string;
  firstName: string;
  lastName: string;
}): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  // Email validation
  if (!validateEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  // Password validation
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.errors[0];
  }

  // Confirm password
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Student ID validation
  const studentIdValidation = validateStudentId(data.studentId);
  if (!studentIdValidation.valid) {
    errors.studentId = studentIdValidation.error || 'Invalid student ID';
  }

  // Name validation
  const firstNameValidation = validateName(data.firstName, 'First name');
  if (!firstNameValidation.valid) {
    errors.firstName = firstNameValidation.error;
  }

  const lastNameValidation = validateName(data.lastName, 'Last name');
  if (!lastNameValidation.valid) {
    errors.lastName = lastNameValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login form data
 */
export function validateLoginForm(data: {
  email: string;
  password: string;
}): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!validateEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
