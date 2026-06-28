import { db } from './firebase-config.js';
import { ref, update, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const statusMessage = document.getElementById('status-message');
const statusSelect = document.getElementById('vehicleStatus');

let watchId = null;

btnStart.addEventListener('click', () => {
    const vId = document.getElementById('vehicleId').value.trim().toUpperCase();
    const dName = document.getElementById('driverName').value.trim();

    if (!vId || !dName) {
        alert("Vui lòng nhập đầy đủ Mã xe và Tên tài xế!");
        return;
    }

    if (!navigator.geolocation) {
        alert("Trình duyệt của bạn không hỗ trợ Geolocation (GPS).");
        return;
    }

    document.getElementById('vehicleId').disabled = true;
    document.getElementById('driverName').disabled = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    statusMessage.innerText = "Đang xin quyền vị trí...";

    const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 };

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const speed = position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) : 0;
            
            const currentStatus = statusSelect.value;
            statusMessage.innerText = `Đang gửi vị trí... (Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)})`;

            const vehicleRef = ref(db, `vehicles/${vId}`);
            
            update(vehicleRef, {
                driverName: dName,
                status: currentStatus,
                lat: lat,
                lng: lng,
                speed: speed,
                lastUpdate: Date.now()
            });

            if (currentStatus === "Đang giao hàng") {
                 push(ref(db, `vehicles/${vId}/history`), { lat, lng });
            }
        },
        (error) => {
            statusMessage.innerText = `Lỗi GPS: ${error.message}`;
            statusMessage.style.color = 'red';
        },
        options
    );
});

statusSelect.addEventListener('change', () => {
    if(watchId) {
        const vId = document.getElementById('vehicleId').value.trim().toUpperCase();
        update(ref(db, `vehicles/${vId}`), { status: statusSelect.value });
    }
});

btnStop.addEventListener('click', () => {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    
    const vId = document.getElementById('vehicleId').value.trim().toUpperCase();
    update(ref(db, `vehicles/${vId}`), { status: "Ngừng hoạt động" });

    document.getElementById('vehicleId').disabled = false;
    document.getElementById('driverName').disabled = false;
    btnStart.disabled = false;
    btnStop.disabled = true;
    statusMessage.innerText = "Đã dừng chuyến đi.";
});