document.addEventListener('DOMContentLoaded', () => {
    // Configurar momento.js para español
    moment.locale('es');
    
    // Elementos DOM
    const devicesContainer = document.getElementById('devices-container');
    const noDevicesAlert = document.getElementById('no-devices');
    const deviceTemplate = document.getElementById('device-template');
    const refreshBtn = document.getElementById('refresh-btn');
    const onlineCountElement = document.getElementById('online-count');
    const offlineCountElement = document.getElementById('offline-count');
    
    
    // Conectar al servidor con Socket.IO
    const socket = io();

    socket.on('connect', () => {
        console.log('Conectado al servidor de dispositivos');
    });

    socket.on('error', (error) => {
        console.error('Error de conexión:', error);
    });
    
    socket.on('disconnect', () => {
        console.log('Desconectado del servidor de dispositivos');
    });
    
    // Escuchar actualizaciones de la lista de dispositivos
    socket.on('device-list-updated', (devices) => {
        updateDeviceList(devices);
    });
    
    
    /*
    // Manejar el botón de actualizar
    refreshBtn.addEventListener('click', () => {
        fetchDevices();
    });
    
    // Función para obtener los dispositivos mediante la API REST
    function fetchDevices() {
        fetch('/api/devices')
            .then(response => response.json())
            .then(devices => {
                updateDeviceList(devices);
            })
            .catch(error => {
                console.error('Error al obtener dispositivos:', error);
            });
    }
            */
    
    // Función para actualizar la lista de dispositivos en la interfaz
    function updateDeviceList(devices) {
        // Limpiar el contenedor de dispositivos
        devicesContainer.innerHTML = '';
        
        if (devices.length === 0) {
            noDevicesAlert.classList.remove('d-none');
            onlineCountElement.textContent = '0';
            offlineCountElement.textContent = '0';
            return;
        }
        
        noDevicesAlert.classList.add('d-none');
        
        // Contar dispositivos online y offline
        let onlineCount = 0;
        let offlineCount = 0;
        
        // Ordenar dispositivos: online primero, luego por nombre
        devices.sort((a, b) => {
            // Primero ordenar por estado (online primero)
            if (a.status === 'online' && b.status !== 'online') return -1;
            if (a.status !== 'online' && b.status === 'online') return 1;
            
            // Luego ordenar por nombre
            return a.name.localeCompare(b.name);
        });
        
        // Generar tarjetas para cada dispositivo
        devices.forEach(device => {
            // Crear un clon del template
            const deviceCard = deviceTemplate.content.cloneNode(true);
            
            // Configurar la tarjeta según el estado
            const card = deviceCard.querySelector('.device-card');
            card.classList.add(device.status === 'online' ? 'device-online' : 'device-offline');
            
            // Actualizar contadores
            if (device.status === 'online') {
                onlineCount++;
            } else {
                offlineCount++;
            }
            
            // Establecer nombre del dispositivo
            deviceCard.querySelector('.device-name').textContent = device.name;
            
            // Establecer estado
            const statusBadge = deviceCard.querySelector('.status-badge');
            if (device.status === 'online') {
                statusBadge.classList.add('bg-success');
                statusBadge.textContent = 'Online';
            } else {
                statusBadge.classList.add('bg-danger');
                statusBadge.textContent = 'Offline';
            }
            
            // Establecer detalles del dispositivo
            deviceCard.querySelector('.device-id').textContent = device.id;
            deviceCard.querySelector('.device-ip').textContent = device.ip || 'Desconocida';
            deviceCard.querySelector('.device-ssid').textContent = device.ssid || 'Desconocida';
            
            // Formatear y establecer la última vez vista
            const lastSeen = moment(device.lastSeen).fromNow();
            deviceCard.querySelector('.device-last-seen').textContent = lastSeen;
            
            // Agregar la tarjeta al contenedor
            devicesContainer.appendChild(deviceCard);
        });
        
        // Actualizar contadores en la interfaz
        onlineCountElement.textContent = onlineCount.toString();
        offlineCountElement.textContent = offlineCount.toString();
    }
    
    /*
    // Cargar dispositivos al iniciar
    fetchDevices();
    
    // Actualizar automáticamente cada 30 segundos
    setInterval(fetchDevices, 30000);
    */
});