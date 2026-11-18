// js/my-orders.js

$(document).ready(function () {
    const currentUser = requireLogin();
    if (!currentUser) return;

    // Hiển thị thông tin sidebar
    $('#sidebarUserName').text(currentUser.name);
    $('#sidebarUserEmail').text(currentUser.email);

    // Định dạng tiền tệ (dùng hàm formatPrice của Thành viên 1 nếu có)
    function formatMoney(amount) {
        if (typeof formatPrice === 'function') return formatPrice(amount);
        return Number(amount).toLocaleString('vi-VN') + 'đ';
    }

    // Nhãn trạng thái đơn hàng
    function getStatusBadge(status) {
        switch (status) {
            case 'pending': return '<span class="badge bg-warning text-dark">Chờ xác nhận</span>';
            case 'shipping': return '<span class="badge bg-info text-dark">Đang giao</span>';
            case 'done': return '<span class="badge bg-success">Đã giao</span>';
            case 'cancelled': return '<span class="badge bg-danger">Đã hủy</span>';
            default: return '<span class="badge bg-secondary">Không xác định</span>';
        }
    }

    // Render danh sách đơn hàng của người dùng hiện tại
    function renderMyOrders(statusFilter = 'all') {
        const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        let userOrders = allOrders.filter(order => order.userId === currentUser.id);

        // Sắp xếp đơn mới nhất lên đầu
        userOrders.reverse();

        if (statusFilter !== 'all') {
            userOrders = userOrders.filter(order => order.status === statusFilter);
        }

        const tbody = $('#myOrdersList');
        tbody.empty();

        if (userOrders.length === 0) {
            $('#emptyOrdersMessage').removeClass('d-none');
            return;
        }

        $('#emptyOrdersMessage').addClass('d-none');

        userOrders.forEach(order => {
            const cancelBtn = order.status === 'pending'
                ? `<button class="btn btn-sm btn-outline-danger btn-cancel-order" data-id="${order.id}">Hủy đơn</button>`
                : '';

            const reOrderBtn = (order.status === 'done' || order.status === 'cancelled')
                ? `<button class="btn btn-sm btn-outline-primary btn-reorder" data-id="${order.id}">Mua lại</button>`
                : '';

            const row = `
                <tr>
                    <td class="fw-semibold text-primary">#${order.id}</td>
                    <td>${order.date || 'N/A'}</td>
                    <td class="fw-bold">${formatMoney(order.total)}</td>
                    <td>${getStatusBadge(order.status)}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-light border btn-view-order" data-id="${order.id}">Chi tiết</button>
                        ${cancelBtn}
                        ${reOrderBtn}
                    </td>
                </tr>
            `;
            tbody.append(row);
        });
    }

    // Lọc đơn hàng
    $('#filterOrderStatus').on('change', function () {
        renderMyOrders($(this).val());
    });

    // Xem chi tiết đơn hàng (Modal)
    $(document).on('click', '.btn-view-order', function () {
        const orderId = String($(this).data('id'));
        const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = allOrders.find(o => String(o.id) === orderId);
        if (!order) return;

        $('#modalOrderId').text('#' + order.id);

        let itemsHtml = '';
        (order.items || []).forEach(item => {
            itemsHtml += `
                <tr>
                    <td>${item.title}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-end">${formatMoney(item.price)}</td>
                    <td class="text-end fw-semibold">${formatMoney(item.price * item.quantity)}</td>
                </tr>
            `;
        });

        const receiver = order.receiver || {};
        const detailHtml = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6 class="fw-bold">Thông tin nhận hàng</h6>
                    <p class="mb-1"><strong>Người nhận:</strong> ${receiver.name || ''}</p>
                    <p class="mb-1"><strong>SĐT:</strong> ${receiver.phone || ''}</p>
                    <p class="mb-1"><strong>Địa chỉ:</strong> ${receiver.address || ''}</p>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold">Thông tin đơn hàng</h6>
                    <p class="mb-1"><strong>Ngày đặt:</strong> ${order.date || ''}</p>
                    <p class="mb-1"><strong>Thanh toán:</strong> ${order.payment || 'COD'}</p>
                    <p class="mb-1"><strong>Trạng thái:</strong> ${getStatusBadge(order.status)}</p>
                </div>
            </div>
            <table class="table table-bordered table-sm">
                <thead class="table-light">
                    <tr>
                        <th>Tên sách</th>
                        <th class="text-center">SL</th>
                        <th class="text-end">Đơn giá</th>
                        <th class="text-end">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-end">Phí vận chuyển:</td>
                        <td class="text-end">${formatMoney(order.shippingFee || 0)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-end">Giảm giá:</td>
                        <td class="text-end text-success">-${formatMoney(order.discount || 0)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-end fw-bold">Tổng thanh toán:</td>
                        <td class="text-end fw-bold text-danger">${formatMoney(order.total)}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        $('#modalOrderBody').html(detailHtml);
        new bootstrap.Modal(document.getElementById('orderDetailModal')).show();
    });

    // Hủy đơn hàng (Chỉ cho phép khi đang ở trạng thái 'pending')
    $(document).on('click', '.btn-cancel-order', function () {
        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;

        const orderId = String($(this).data('id'));
        const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = allOrders.findIndex(o => String(o.id) === orderId);

        if (orderIndex !== -1 && allOrders[orderIndex].status === 'pending') {
            allOrders[orderIndex].status = 'cancelled';
            localStorage.setItem('orders', JSON.stringify(allOrders));

            // Hoàn lại tồn kho (stock) và giảm số lượng đã bán (sold) trong books
            const books = JSON.parse(localStorage.getItem('books')) || [];
            (allOrders[orderIndex].items || []).forEach(item => {
                const bookIndex = books.findIndex(b => String(b.id) === String(item.bookId));
                if (bookIndex !== -1) {
                    books[bookIndex].stock = (books[bookIndex].stock || 0) + item.quantity;
                    books[bookIndex].sold = Math.max(0, (books[bookIndex].sold || 0) - item.quantity);
                }
            });
            localStorage.setItem('books', JSON.stringify(books));

            notify('Đã hủy đơn hàng thành công!', 'success');
            renderMyOrders($('#filterOrderStatus').val());
        }
    });

    // Mua lại đơn hàng (Thêm các sách trong đơn cũ vào giỏ hàng)
    $(document).on('click', '.btn-reorder', function () {
        const orderId = String($(this).data('id'));
        const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        const order = allOrders.find(o => String(o.id) === orderId);
        if (!order) return;

        (order.items || []).forEach(item => {
            if (typeof addToCart === 'function') {
                addToCart(item.bookId, item.quantity);
            } else {
                // Fallback nếu cart.js của TV4 chưa load
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                const existing = cart.find(c => String(c.bookId) === String(item.bookId));
                if (existing) {
                    existing.quantity += item.quantity;
                } else {
                    cart.push({ bookId: item.bookId, quantity: item.quantity });
                }
                localStorage.setItem('cart', JSON.stringify(cart));
            }
        });

        notify('Đã thêm các sản phẩm vào giỏ hàng!', 'success');
        window.location.href = 'cart.html';
    });

    renderMyOrders();
});