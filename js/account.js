// js/account.js

$(document).ready(function () {
    // Bắt buộc đăng nhập mới được vào trang này
    const currentUser = requireLogin();
    if (!currentUser) return;

    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) {
        logout();
        return;
    }

    const fullUserData = users[userIndex];

    // Hiển thị thông tin lên Sidebar và Form
    $('#sidebarUserName').text(fullUserData.name);
    $('#sidebarUserEmail').text(fullUserData.email);

    $('#accEmail').val(fullUserData.email);
    $('#accName').val(fullUserData.name);
    $('#accPhone').val(fullUserData.phone || '');
    $('#accAddress').val(fullUserData.address || '');

    // 1. Cập nhật thông tin hồ sơ
    $('#profileForm').on('submit', function (e) {
        e.preventDefault();

        const name = $('#accName').val().trim();
        const phone = $('#accPhone').val().trim();
        const address = $('#accAddress').val().trim();

        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

        if (!name) {
            notify('Họ tên không được để trống!', 'danger');
            return;
        }
        if (!phoneRegex.test(phone)) {
            notify('Số điện thoại không hợp lệ!', 'danger');
            return;
        }

        // Cập nhật mảng users
        users[userIndex].name = name;
        users[userIndex].phone = phone;
        users[userIndex].address = address;
        saveUsers(users);

        // Cập nhật lại currentUser trong localStorage
        currentUser.name = name;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        $('#sidebarUserName').text(name);
        notify('Cập nhật thông tin cá nhân thành công!', 'success');
    });

    // 2. Đổi mật khẩu
    $('#changePasswordForm').on('submit', function (e) {
        e.preventDefault();

        const oldPassword = $('#oldPassword').val();
        const newPassword = $('#newPassword').val();
        const confirmNewPassword = $('#confirmNewPassword').val();

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

        if (oldPassword !== users[userIndex].password) {
            notify('Mật khẩu hiện tại không chính xác!', 'danger');
            return;
        }
        if (!passwordRegex.test(newPassword)) {
            notify('Mật khẩu mới phải từ 6 ký tự trở lên, gồm cả chữ và số!', 'danger');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            notify('Xác nhận mật khẩu mới không khớp!', 'danger');
            return;
        }

        users[userIndex].password = newPassword;
        saveUsers(users);

        $('#changePasswordForm')[0].reset();
        notify('Đổi mật khẩu thành công!', 'success');
    });
});