export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | undefined;
}

export const validateField = (
  value: string,
  rules: ValidationRules,
  fieldName: string
): string | undefined => {
  if (rules.required && !value.trim()) {
    return `${fieldName} is required`;
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be less than ${rules.maxLength} characters`;
  }

  if (rules.pattern && value && !rules.pattern.test(value)) {
    return `Please enter a valid ${fieldName.toLowerCase()}`;
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return undefined;
};

export const signupValidationRules = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  email: {
    required: true,
    pattern: /\S+@\S+\.\S+/,
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    custom: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) {
        return "Password must contain at least one lowercase letter";
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return "Password must contain at least one uppercase letter";
      }
      if (!/(?=.*\d)/.test(value)) {
        return "Password must contain at least one number";
      }
      return undefined;
    },
  },
};
