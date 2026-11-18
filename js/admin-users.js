// js/admin-users.js

$(document).ready(function () {
    // Bảo vệ trang: Chỉ admin mới được truy cập
    const currentAdmin = requireAdmin();
    if (!currentAdmin) return;

    function renderUsersTable() {
        const keyword = $('#searchUser').val().toLowerCase().trim();
        const roleFilter = $('#filterRole').val();
        const statusFilter = $('#filterStatus').val();

        let users = getUsers();

        // Lọc dữ liệu
        if (keyword) {
            users = users.filter(u =>
                u.name.toLowerCase().includes(keyword) ||
                u.email.toLowerCase().includes(keyword)
            );
        }
        if (roleFilter !== 'all') {
            users = users.filter(u => u.role === roleFilter);
        }
        if (statusFilter !== 'all') {
            users = users.filter(u => u.status === statusFilter);
        }

        const tbody = $('#adminUsersTable');
        tbody.empty();

        if (users.length === 0) {
            tbody.html('<tr><td colspan="7" class="text-center text-muted py-4">Không tìm thấy người dùng nào.</td></tr>');
            return;
        }

        users.forEach(user => {
            const isSelf = user.id === currentAdmin.id;

            const roleBadge = user.role === 'admin'
                ? '<span class="badge bg-primary">Admin</span>'
                : '<span class="badge bg-secondary">User</span>';

            const statusBadge = user.status === 'active'
                ? '<span class="badge bg-success">Hoạt động</span>'
                : '<span class="badge bg-danger">Bị khóa</span>';

            // Không cho phép admin tự khóa hoặc tự hạ quyền chính mình
            const actionButtons = isSelf
                ? '<span class="text-muted fst-italic small">Tài khoản hiện tại</span>'
                : `
                    <button class="btn btn-sm btn-outline-primary btn-toggle-role me-1" data-id="${user.id}" title="Đổi vai trò">
                        <i class="bi bi-person-gear"></i> ${user.role === 'admin' ? 'Hạ User' : 'Lên Admin'}
                    </button>
                    <button class="btn btn-sm ${user.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success'} btn-toggle-status" data-id="${user.id}">
                        <i class="bi ${user.status === 'active' ? 'bi-lock' : 'bi-unlock'}"></i> ${user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                    </button>
                `;

            const row = `
                <tr>
                    <td><small class="text-muted">${user.id}</small></td>
                    <td class="fw-semibold">${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone || '-'}</td>
                    <td>${roleBadge}</td>
                    <td>${statusBadge}</td>
                    <td class="text-end">${actionButtons}</td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    // Sự kiện tìm kiếm & lọc
    $('#searchUser').on('input', renderUsersTable);
    $('#filterRole, #filterStatus').on('change', renderUsersTable);

    // Đổi vai trò (User <-> Admin)
    $(document).on('click', '.btn-toggle-role', function () {
        const userId = String($(this).data('id'));
        const users = getUsers();
        const index = users.findIndex(u => String(u.id) === userId);

        if (index !== -1) {
            const newRole = users[index].role === 'admin' ? 'user' : 'admin';
            if (confirm(`Xác nhận đổi vai trò của "${users[index].name}" thành ${newRole.toUpperCase()}?`)) {
                users[index].role = newRole;
                saveUsers(users);
                notify('Đã cập nhật vai trò người dùng!', 'success');
                renderUsersTable();
            }
        }
    });

    // Khóa / Mở khóa tài khoản
    $(document).on('click', '.btn-toggle-status', function () {
        const userId = String($(this).data('id'));
        const users = getUsers();
        const index = users.findIndex(u => String(u.id) === userId);

        if (index !== -1) {
            const newStatus = users[index].status === 'active' ? 'locked' : 'active';
            const actionText = newStatus === 'locked' ? 'KHÓA' : 'MỞ KHÓA';

            if (confirm(`Bạn có chắc muốn ${actionText} tài khoản "${users[index].name}"?`)) {
                users[index].status = newStatus;
                saveUsers(users);
                notify(`Đã ${actionText.toLowerCase()} tài khoản thành công!`, 'success');
                renderUsersTable();
            }
        }
    });

    renderUsersTable();
});