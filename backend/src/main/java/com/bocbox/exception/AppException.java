package com.bocbox.exception;

/** Lỗi nghiệp vụ có thông báo tiếng Việt hiển thị thẳng cho người dùng. */
public class AppException extends RuntimeException {
    private final ErrorType type;

    public AppException(ErrorType type, String message) {
        super(message);
        this.type = type;
    }

    public ErrorType getType() { return type; }

    public static AppException invalid(String message) { return new AppException(ErrorType.INVALID, message); }
    public static AppException unauthorized(String message) { return new AppException(ErrorType.UNAUTHORIZED, message); }
    public static AppException notFound(String message) { return new AppException(ErrorType.NOT_FOUND, message); }
    public static AppException conflict(String message) { return new AppException(ErrorType.CONFLICT, message); }
    public static AppException tooLarge(String message) { return new AppException(ErrorType.TOO_LARGE, message); }
    public static AppException unsupportedMedia(String message) { return new AppException(ErrorType.UNSUPPORTED_MEDIA, message); }
    public static AppException tooManyRequests(String message) { return new AppException(ErrorType.TOO_MANY_REQUESTS, message); }
}
