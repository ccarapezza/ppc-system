const API_HOST = 'http://192.168.0.66';

if (!Element.prototype.closest) {
	if (!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}
	Element.prototype.closest = function (s) {
		var el = this;
		var ancestor = this;
		if (!document.documentElement.contains(el)) return null;
		do {
			if (ancestor.matches(s)) return ancestor;
			ancestor = ancestor.parentElement;
		} while (ancestor !== null);
		return null;
	};
}

document.addEventListener('DOMContentLoaded', function () {
    wifiScanLoop();
    interval = setInterval(connectionStatus, 5000);
});

const connectionStatus = async () => {
    console.log('connectionStatus...');
    const loading = document.getElementById('ap-info-loading');
    const loadingWifiStatus = document.getElementById('wifi-status-loading');

    const apInfoContainer = document.getElementById('ap-info');
    loading.classList.remove('hidden');
    loadingWifiStatus.classList.remove('hidden');
    apInfoContainer.classList.add('hidden');

    const status = await getCurrentWifiStatus();
    if(status?.status === 'connected') {
        document.getElementById('conn-status-connected').classList.remove('hidden');
        document.getElementById('conn-status-disconnected').classList.add('hidden');
        document.getElementById('connection-status').innerHTML = `Connected to ${status.ssid}`;
    }else{
        document.getElementById('conn-status-connected').classList.add('hidden');
        document.getElementById('conn-status-disconnected').classList.remove('hidden');
    }

    document.getElementById('ap-name').innerHTML = status?.["ap-info"]?.ssid;
    document.getElementById('ap-ip').innerHTML = status?.["ap-info"]?.ip;

    loading.classList.add('hidden');
    loadingWifiStatus.classList.add('hidden');
    apInfoContainer.classList.remove('hidden');
}

const getCurrentWifiStatus = () => {
    return fetch(`${API_HOST}/wifi-status`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => response.json());
}

const wifiScan = () => {
    return fetch(`${API_HOST}/wifi-scan`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => response.json());
}

const getEncryptionLabel = (encryptionType) => {
    switch (encryptionType) {
        case 'WPA2':
            return 'WPA2';
        case 'WPA':
            return 'WPA';
        case 'WEP':
            return 'WEP';
        case 'OPEN':
            return 'OPEN';
        default:
            return 'UNKNOWN';
    }
}

const wifiScanLoop = async () => {
    let data;
    const loading = document.getElementById('wifi-loading');
    const wifiNetworkContainer = document.getElementById('wifi-network');

    wifiNetworkContainer.classList.add('hidden');
    loading.classList.remove('hidden');

    while (!data) {
        data = await wifiScan();
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const wifiNetworks = data?.data || [];
        
    wifiNetworks.sort((a, b) => {
        return b.RSSI - a.RSSI;
    }).slice(0, 10).forEach((network) => {
        const networkElement = document.createElement('li');
        networkElement.classList.add('flex', 'justify-between', 'items-center', 'p-2', 'border-b', 'border-gray-200');
        const minRSSI = -100;
        const maxRSSI = 0;
        const signalStrength = (network.RSSI - minRSSI) / (maxRSSI - minRSSI);
        networkElement.innerHTML = `
            <div class="text-sm">
                ${network.ssid}
                <span className="px-4">
                    ${network.encryptionType != 7 ? '<i class="fa-solid fa-lock"></i>' : ''}
                </span>
            </div>
            <div class="text-sm flex flex-col">
                <i class="fa-solid fa-wifi 2x" style="opacity: ${signalStrength}"></i>
                <span class="text-xs">${Math.round(signalStrength*100)}%</span>
            </div>
        `;
        networkElement.addEventListener('click', () => {
            console.log("clicked", network.ssid);
        });
        wifiNetworkContainer.appendChild(networkElement);
    });

    loading.classList.add('hidden');
    wifiNetworkContainer.classList.remove('hidden');
}