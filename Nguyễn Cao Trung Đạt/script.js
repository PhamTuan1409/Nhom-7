function animateProgressBars() {
    const progressElements = document.querySelectorAll('.progress');
    progressElements.forEach(bar => {
        const targetWidth = bar.getAttribute('style').split(':')[1].trim();
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 200);
    });
}
function displayGreeting() {
    const greetingMsg = document.getElementById('greeting-msg');
    const now = new Date();
    const currentHour = now.getHours();
    const dateStr = now.toLocaleDateString('vi-VN');

    let text = "";
    if (currentHour >= 5 && currentHour < 12) text = "Chào buổi sáng ☀️";
    else if (currentHour >= 12 && currentHour < 18) text = "Chào buổi chiều 🌤️";
    else text = "Chào buổi tối 🌙";

    greetingMsg.innerText = `${text} | Hôm nay là: ${dateStr}`;
}
function setupPrint() {
    const btn = document.getElementById('download-btn');
    btn.addEventListener('click', function () {
        window.print();
    });
}

// 4. Chạy toàn bộ khi trang load xong
window.onload = function () {
    displayGreeting();
    animateProgressBars();
    setupPrint();
};