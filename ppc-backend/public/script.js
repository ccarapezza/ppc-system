fetch("/devices")
  .then((res) => res.json())
  .then((devices) => {
    const list = document.getElementById("deviceList");
    list.innerHTML = devices.map(d => `
      <div class="mb-2 border-b pb-2">
        <strong>ID:</strong> ${d.device_id}<br />
        <strong>Usuario:</strong> ${d.user_id}<br />
        <strong>Vinculado:</strong> ${d.linked_at}
      </div>
    `).join("");
  });
