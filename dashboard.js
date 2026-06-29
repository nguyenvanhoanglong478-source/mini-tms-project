import { db } from './firebase-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const map = L.map('map').setView([10.8231, 106.6297], 12); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markers = {};
const polylines = {};
const vehicleListEl = document.getElementById('vehicle-list');

// Định dạng thời gian hiển thị: DD/MM/YYYY HH:MM
function formatDeliveryTime(datetimeStr) {
    if (!datetimeStr) return "Chưa xác định";
    const d = new Date(datetimeStr);
    if (isNaN(d.getTime())) return datetimeStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Định dạng hiển thị Phí phụ thu
function formatSurcharge(fee) {
    if (!fee || Number(fee) === 0) return "Không có";
    return Number(fee).toLocaleString('vi-VN') + " VNĐ";
}

function getStatusClass(status) {
    if(status === 'Đang giao hàng') return 'bg-active';
    if(status === 'Tạm dừng') return 'bg-paused';
    return 'bg-done'; 
}

const vehiclesRef = ref(db, 'vehicles');

onValue(vehiclesRef, (snapshot) => {
    vehicleListEl.innerHTML = ''; 
    const vehiclesData = snapshot.val();

    if (!vehiclesData) {
        vehicleListEl.innerHTML = '<p>Hiện không có xe nào trực tuyến.</p>';
        return;
    }

    for (const [vId, data] of Object.entries(vehiclesData)) {
        const badgeClass = getStatusClass(data.status);
        const lastTime = new Date(data.lastUpdate).toLocaleTimeString('vi-VN');
        
        // Tạo Card chứa đầy đủ thông tin TMS mới bổ sung theo yêu cầu
        const div = document.createElement('div');
        div.className = 'vehicle-item';
        div.style.borderLeft = "5px solid " + (data.status === 'Đang giao hàng' ? '#28a745' : (data.status === 'Tạm dừng' ? '#ffc107' : '#6c757d'));
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h3 style="margin: 0; color: #111;">BKS: ${vId}</h3>
                <span class="badge ${badgeClass}">${data.status}</span>
            </div>
            <div style="font-size: 13.5px; line-height: 1.5; color: #444;">
                <p><strong>👤 Tài xế:</strong> ${data.driverName || 'N/A'}</p>
                <p><strong>🏢 Khách hàng:</strong> ${data.customerName || 'N/A'}</p>
                <p><strong>📦 Loại hàng:</strong> ${data.cargoType || 'N/A'}</p>
                <p><strong>🟢 Điểm đi:</strong> ${data.startLocation || 'N/A'}</p>
                <p><strong>🔴 Điểm đến:</strong> ${data.endLocation || 'N/A'}</p>
                <p><strong>⏱️ Dự kiến giao:</strong> <span style="color: #0056b3; font-weight: bold;">${formatDeliveryTime(data.deliveryTime)}</span></p>
                <p><strong>💰 Phí phụ thu:</strong> ${formatSurcharge(data.surcharge)}</p>
                <p style="margin-top: 5px; border-top: 1px dashed #ddd; padding-top: 5px; font-size: 12px; color: #777;">
                    ⚡ Vận tốc: ${data.speed || 0} km/h | Cập nhật: ${lastTime}
                </p>
            </div>
        `;
        
        div.onclick = () => {
            map.flyTo([data.lat, data.lng], 15, { animate: true, duration: 1.2 });
        };
        vehicleListEl.appendChild(div);

        // --- RENDER ICON XE TẢI TRÊN BẢN ĐỒ ---
        let iconColorClass = data.status === 'Đang giao hàng' ? 'status-active' : 
                            (data.status === 'Tạm dừng' ? 'status-paused' : 'status-done');

        const truckIcon = L.divIcon({
            html: `<div class="truck-marker ${iconColorClass}">🚚</div>`,
            className: '', 
            iconSize: [30, 30],
            iconAnchor: [15, 15] 
        });

        // Popup thu gọn khi click vào Marker trên bản đồ Leaflet
        const popupContent = `
            <b>Xe: ${vId}</b><br>
            Tài xế: ${data.driverName}<br>
            Khách: ${data.customerName}<br>
            Hàng: ${data.cargoType}<br>
            Trạng thái: ${data.status}
        `;

        if (markers[vId]) {
            markers[vId].setLatLng([data.lat, data.lng]);
            markers[vId].setIcon(truckIcon);
            markers[vId].getPopup().setContent(popupContent);
        } else {
            markers[vId] = L.marker([data.lat, data.lng], { icon: truckIcon }).addTo(map);
            markers[vId].bindPopup(popupContent);
        }

        // --- VẼ LỊCH SỬ TUYẾN ĐƯỜNG DI CHUYỂN (POLYLINE) ---
        if (data.history) {
            const pathCoords = Object.values(data.history).map(pos => [pos.lat, pos.lng]);
            pathCoords.push([data.lat, data.lng]);

            if (polylines[vId]) {
                polylines[vId].setLatLngs(pathCoords);
            } else {
                polylines[vId] = L.polyline(pathCoords, { color: '#007bff', weight: 4, opacity: 0.75 }).addTo(map);
            }
        }
    }
});
