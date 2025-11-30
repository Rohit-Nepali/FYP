import { useState, useCallback } from "react";

export const useSignupForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearError = useCallback((field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  const toggleAgreeToTerms = useCallback(() => {
    setAgreeToTerms((prev) => !prev);
    if (errors.terms) {
      clearError("terms");
    }
  }, [errors.terms, clearError]);

  const resetForm = useCallback(() => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAgreeToTerms(false);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    // State
    formData,
    showPassword,
    showConfirmPassword,
    agreeToTerms,
    errors,
    isSubmitting,

    // State setters
    setFormData,
    setErrors,
    setIsSubmitting,

    // Methods
    updateFormData,
    clearError,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    toggleAgreeToTerms,
    resetForm,
  };
};
