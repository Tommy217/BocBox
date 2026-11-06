package com.bocbox.exception;

/** Loại lỗi nghiệp vụ; GlobalExceptionHandler đổi sang mã HTTP tương ứng. Service không phụ thuộc HTTP. */
public enum ErrorType {
    INVALID,            // 400: dữ liệu gửi lên sai luật nghiệp vụ
    UNAUTHORIZED,       // 401: sai thông tin đăng nhập / tài khoản bị khóa
    NOT_FOUND,          // 404
    CONFLICT,           // 409: trạng thái hiện tại không cho phép thao tác
    TOO_LARGE,          // 413
    UNSUPPORTED_MEDIA,  // 415
    TOO_MANY_REQUESTS   // 429: khóa đăng nhập tạm thời
}
