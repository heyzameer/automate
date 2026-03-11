export enum ResponseMessages {
    USER_NOT_FOUND = 'User not found',
    EMAIL_ALREADY_REGISTERED = 'Email already registered',
    PHONE_ALREADY_REGISTERED = 'Phone number already registered',
    INVALID_CREDENTIALS = 'Invalid credentials',
    ACCOUNT_DEACTIVATED = 'Account is deactivated',
    ACCESS_DENIED = 'Access denied',
    INVALID_REQUEST = 'Invalid request',
    CURRENT_PASSWORD_INCORRECT = 'Current password is incorrect',
    NO_PASSWORD_SET = 'This account does not have a password set',
    BOTH_PASSWORDS_REQUIRED = 'Both current and new password are required',
    PROFILE_UPDATE_FAILED = 'Failed to update profile',
    USER_STATUS_UPDATE_FAILED = 'Failed to update user status',
    DEACTIVATE_USER_FAILED = 'Failed to deactivate user',
    ACTIVATE_USER_FAILED = 'Failed to activate user',
    INVALID_TOKEN = 'Invalid token',
    AUTH_TOKEN_REQUIRED = 'Authentication token required',
    USER_NOT_FOUND_OR_INACTIVE = 'User not found or inactive',
    OTP_EMAIL_SEND_FAILED = 'Failed to send OTP email',
    EMAIL_SEND_FAILED = 'Failed to send email',

    // Success Messages
    REGISTER_SUCCESS = 'User registered successfully',
    LOGIN_SUCCESS = 'Login successful',
    LOGOUT_SUCCESS = 'Logout successful',
    PROFILE_RETRIEVED = 'Profile retrieved successfully',
    PROFILE_UPDATED = 'Profile updated successfully',
    PASSWORD_RESET_OTP_SENT = 'Password reset OTP sent to your email',
    PASSWORD_RESET_SUCCESS = 'Password reset successfully',
    PASSWORD_CHANGED = 'Password changed successfully',
    OTP_SENT = 'OTP sent successfully',
    OTP_VERIFIED = 'Verified successfully',
    TOKEN_REFRESHED = 'Token refreshed successfully',
    TOKEN_VALID = 'Token is valid',
    GENERIC_SUCCESS = 'Operation successful',

    // User Success Messages
    USERS_RETRIEVED = 'Users retrieved successfully',
    USER_RETRIEVED = 'User retrieved successfully',
    USER_DEACTIVATED = 'User deactivated successfully',
    USER_ACTIVATED = 'User activated successfully',

    // Email Success Messages
    EMAIL_SENT_SUCCESS = 'Email sent successfully',

    // Other Messages
    NOT_FOUND = 'Resource not found',
    AUTH_REQUIRED = 'Authentication required',
    USER_UPDATED = 'User updated successfully',
    USER_DELETED = 'User deleted successfully',
}
