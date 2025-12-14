import { useState, useCallback } from "react";

export const useLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  console.log("errors ", errors)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = useCallback((field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  return {
    // State
    email,
    password,
    showPassword,
    errors,
    isSubmitting,

    // State setters
    setEmail,
    setPassword,
    setErrors,
    setIsSubmitting,

    // Methods
    clearError,
    togglePasswordVisibility,
    resetForm,
  };
};
