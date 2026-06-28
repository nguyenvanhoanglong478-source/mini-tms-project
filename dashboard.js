import { db } from './firebase-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Mặc định focus về trung tâm TP.HCM, zoom level 13
const map = L.map('map').setView([10.8231, 106.6297], 13); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markers = {};
const polylines = {};
const vehicleListEl = document.getElementById('vehicle-list');

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
        vehicleListEl.innerHTML = '<p>Chưa có xe nào hoạt động.</p>';
        return;
    }

    for (const [vId, data] of Object.entries(vehiclesData)) {
        
        const badgeClass = getStatusClass(data.status);
        const timeString = new Date(data.lastUpdate).toLocaleTimeString('vi-VN');
        
        const div = document.createElement('div');
        div.className = 'vehicle-item';
        div.innerHTML = `
            <h3>Xe: ${vId}</h3>
            <p><strong>Tài xế:</strong> ${data.driverName}</p>
            <p><span class="badge ${badgeClass}">${data.status}</span></p>
            <p>Tốc độ: ${data.speed || 0} km/h</p>
            <p><small>Cập nhật: ${timeString}</small></p>
        `;
        
        div.onclick = () => {
            map.flyTo([data.lat, data.lng], 16, { animate: true, duration: 1 });
        };
        vehicleListEl.appendChild(div);

        let iconColorClass = data.status === 'Đang giao hàng' ? 'status-active' : 
                            (data.status === 'Tạm dừng' ? 'status-paused' : 'status-done');

        const truckIcon = L.divIcon({
            html: `<div class="truck-marker ${iconColorClass}">🚚</div>`,
            className: '', 
            iconSize: [30, 30],
            iconAnchor: [15, 15] 
        });

        const popupContent = `<b>Xe: ${vId}</b><br>Tài xế: ${data.driverName}<br>Trạng thái: ${data.status}`;

        if (markers[vId]) {
            markers[vId].setLatLng([data.lat, data.lng]);
            markers[vId].setIcon(truckIcon);
            markers[vId].getPopup().setContent(popupContent);
        } else {
            markers[vId] = L.marker([data.lat, data.lng], { icon: truckIcon }).addTo(map);
            markers[vId].bindPopup(popupContent);
        }

        if (data.history) {
            const pathCoords = Object.values(data.history).map(pos => [pos.lat, pos.lng]);
            pathCoords.push([data.lat, data.lng]);

            if (polylines[vId]) {
                polylines[vId].setLatLngs(pathCoords);
            } else {
                polylines[vId] = L.polyline(pathCoords, { color: '#007bff', weight: 4, opacity: 0.7 }).addTo(map);
            }
        }
    }
});