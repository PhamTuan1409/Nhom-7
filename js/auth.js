// js/auth.js

// 1. Khởi tạo dữ liệu người dùng mặc định nếu localStorage chưa có
function initUsersData() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            {
                id: 'u_admin',
                name: 'Quản trị viên',
                email: 'admin@bookshop.com',
                password: '123',
                phone: '0901234567',
                address: '123 Đường Sách, TP.HCM',
                role: 'admin',
                status: 'active'
            },
            {
                id: 'u_1',
                name: 'Lê Gia Huy',
                email: 'huy@gmail.com',
                password: '123',
                phone: '0912345678',
                address: 'Tuy Hòa, Đắk Lắk',
                role: 'user',
                status: 'active'
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

// 2. Các hàm dùng chung cho toàn nhóm
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function requireLogin() {
    const user = getCurrentUser();
    if (!user) {
        sessionStorage.setItem('redirectUrl', window.location.href);
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function requireAdmin() {
    const user = requireLogin();
    if (user && user.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang quản trị!');
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Hàm hiển thị thông báo (Dùng showToast của Thành viên 1 nếu có, không thì dùng alert)
function notify(msg, type = 'info') {
    if (typeof showToast === 'function') {
        showToast(msg, type);
    } else {
        alert(msg);
    }
}

// 3. Xử lý sự kiện DOM khi tải trang
$(document).ready(function () {
    initUsersData();

    // Tính năng ẩn/hiện mật khẩu
    $(document).on('click', '.toggle-password', function () {
        const targetSelector = $(this).data('target');
        const input = $(targetSelector);
        const icon = $(this).find('i');

        if (input.attr('type') === 'password') {
            input.attr('type', 'text');
            icon.removeClass('bi-eye').addClass('bi-eye-slash');
        } else {
            input.attr('type', 'password');
            icon.removeClass('bi-eye-slash').addClass('bi-eye');
        }
    });

    // Tự động điền email nếu trước đó có tích "Ghi nhớ đăng nhập"
    if ($('#loginForm').length) {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            $('#email').val(rememberedEmail);
            $('#rememberMe').prop('checked', true);
        }
    }

    // Xử lý Form Đăng ký (register.html)
    $('#registerForm').on('submit', function (e) {
        e.preventDefault();

        const name = $('#name').val().trim();
        const email = $('#email').val().trim();
        const phone = $('#phone').val().trim();
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();

        // Regex kiểm tra dữ liệu
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/; // Tối thiểu 6 ký tự, có chữ và số

        let isValid = true;

        // Reset trạng thái lỗi cũ
        $('#registerForm .form-control').removeClass('is-invalid');

        if (!name) {
            $('#name').addClass('is-invalid');
            isValid = false;
        }
        if (!emailRegex.test(email)) {
            $('#email').addClass('is-invalid');
            isValid = false;
        }
        if (!phoneRegex.test(phone)) {
            $('#phone').addClass('is-invalid');
            isValid = false;
        }
        if (!passwordRegex.test(password)) {
            $('#password').addClass('is-invalid');
            isValid = false;
        }
        if (password !== confirmPassword || !confirmPassword) {
            $('#confirmPassword').addClass('is-invalid');
            isValid = false;
        }

        if (!isValid) return;

        const users = getUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            notify('Email này đã được sử dụng. Vui lòng chọn email khác!', 'danger');
            $('#email').addClass('is-invalid');
            return;
        }

        const newUser = {
            id: 'u_' + Date.now(),
            name: name,
            email: email,
            password: password,
            phone: phone,
            address: '',
            role: 'user',
            status: 'active'
        };

        users.push(newUser);
        saveUsers(users);

        notify('Đăng ký tài khoản thành công! Đang chuyển sang trang đăng nhập...', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1200);
    });

    // Xử lý Form Đăng nhập (login.html)
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();

        const email = $('#email').val().trim();
        const password = $('#password').val();
        const rememberMe = $('#rememberMe').is(':checked');

        $('#loginForm .form-control').removeClass('is-invalid');

        if (!email || !password) {
            if (!email) $('#email').addClass('is-invalid');
            if (!password) $('#password').addClass('is-invalid');
            return;
        }

        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

        if (!user) {
            notify('Email hoặc mật khẩu không chính xác!', 'danger');
            return;
        }

        if (user.status === 'locked') {
            notify('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!', 'danger');
            return;
        }

        // Lưu thông tin ghi nhớ email
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // Lưu currentUser
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }));

        notify('Đăng nhập thành công!', 'success');

        // Quay lại trang trước đó nếu có, ngược lại về trang chủ hoặc admin
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        sessionStorage.removeItem('redirectUrl');

        setTimeout(() => {
            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 800);
    });

    // Nút đăng xuất trên sidebar hoặc admin navbar
    $(document).on('click', '#btnLogoutSidebar, #btnAdminLogout', function () {
        logout();
    });
});