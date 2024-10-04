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

var events = [
    {
        id: 1,
        time: "12:00",
        event: 1
    },
    {
        id: 2,
        time: "12:30",
        event: 0
    },
    {
        id: 3,
        time: "13:00",
        event: 1
    },
    {
        id: 4,
        time: "13:30",
        event: 0
    }
]

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('editEvent-hours').onchange = function(e){
        document.getElementById('editEvent-hours').value = e.target.value.toString().padStart(2, '0');
    };
    document.getElementById('editEvent-minutes').onchange = function(e){
        document.getElementById('editEvent-minutes').value = e.target.value.toString().padStart(2, '0');
    };
    loadEvents();
    document.getElementById("editEvent-form").addEventListener("submit", function(e){
        e.preventDefault();
        const hours = document.getElementById('editEvent-hours').value;
        const minutes = document.getElementById('editEvent-minutes').value;
        const id = document.getElementById('editEvent-id').value;
        //TODO: replace with real event
        events = events.map(function(obj){
            if(obj.id == id){
                obj.time = hours.toString().padStart(2, '0') + ":" + minutes.toString().padStart(2, '0');
            }
            return obj;
        });
        loadEvents();
        document.getElementById('editEvent-tailwindModal').classList.add('hidden');
        renderClock();
    });
    updateStatus();
    setInterval(renderClock, 1000);
});

function renderClock(){
    const now = new Date();
    document.getElementById("clock").innerHTML = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0'); //+ ":" + now.getSeconds().toString().padStart(2, '0');
    document.getElementById("clock-sec").innerHTML = now.getSeconds().toString().padStart(2, '0');
    setTimeout(colonBlink, 500);
}

function colonBlink(){
    document.getElementById("clock").innerHTML = document.getElementById("clock").innerHTML.replace(":", " ");
}

function loadEvents(){
    document.getElementById('events').innerHTML = '';
    if(events.length === 0){
        document.getElementById('events').innerHTML = '<div class="flex justify-center items-center"><p class="text-gray-500">No hay eventos programados</p></div>';
    }else{
        events.forEach(event => {
            appendEvent(event.time, event.event, event.id);
        });
    }
}

function removeEvent(id){
    showTailwindModal('Eliminar evento', '¿Estás seguro que deseas eliminar este evento?', function(){
        events = events.filter(function( obj ) {
            return obj.id !== id;
        });
        loadEvents();
    });
}
    
function closeOpenNavs() {
  var openDrops = document.getElementsByClassName("menu-profile");
	for (var i = 0; i < openDrops.length; i++) {
		var openDropdown = openDrops[i];
		if (!openDropdown.classList.contains('hidden')) {
		  openDropdown.classList.add('hidden');
		}
	}  
}

document.addEventListener('click', function (event) {
	//if not a dropdown / click outside close open navs
	if (!event.target.closest('.user-menu-button')){
		closeOpenNavs();
	} 
	//if you click the trigger of an open menu, close it
	else if (event.target.closest('.user-menu-button') && event.target.closest('.hidden')){
		console.log('open trigger');
        document.getElementById("menu-profile").classList.remove('hidden');
	}
	//if a drop target, close any open, then open this one
	else if (event.target.closest('.user-menu-button')){
		closeOpenNavs();
		document.getElementById("menu-profile").classList.remove('hidden');
	}
	
}, false);

function showEditEventModal(id){
    document.getElementById('event-modal-title').innerHTML = 'Edit event';
    const event = events.find(event => event.id === id);
    document.getElementById('editEvent-tailwindModal').classList.remove('hidden');
    const hours = event.time.split(':')[0];
    const minutes = event.time.split(':')[1];
    document.getElementById('editEvent-id').value = id;
    document.getElementById('editEvent-hours').value = hours;
    document.getElementById('editEvent-minutes').value = minutes;

    let eventDiv = document.createElement('div');
    if(event.event === 0){
        eventDiv.classList.add('font-bold', 'text-red-500');
        eventDiv.innerHTML = "OFF";
    }else{
        eventDiv.classList.add('font-bold', 'text-green-500');
        eventDiv.innerHTML = "ON";
    }

    document.getElementById('editEvent-event').innerHTML = '';
    document.getElementById('editEvent-event').append(eventDiv);

    document.getElementById("editEvent-event").classList.remove('hidden');
    document.getElementById("editEvent-eventSelector").classList.add('hidden');

}

function showTailwindModal(title, message, confirmCallback){
    document.getElementById('tailwindModal').classList.remove('hidden');
    document.getElementById('tailwindModalMessageTitle').innerHTML = title;
    document.getElementById('tailwindModalMessage').innerHTML = message;
    let el = document.getElementById('tailwindModalConfirm'),
    elClone = el.cloneNode(true);
    el.parentNode.replaceChild(elClone, el);
    document.getElementById('tailwindModalConfirm').addEventListener('click', function(){
        document.getElementById('tailwindModal').classList.add('hidden');
        confirmCallback();
    });
}

function addEvent(id, time, event){
    events.push({
        id: id,
        time: time,
        event: event
    });
    loadEvents();
}

function appendEvent(time, event, id){
    let row = document.createElement('div');
    row.id = id;
    row.classList.add('flex', 'justify-between', 'items-center');

    let timeDiv = document.createElement('div');
    timeDiv.innerHTML = time;

    let eventDiv = document.createElement('div');
    if(event === 0){
        eventDiv.classList.add('font-bold', 'text-red-500');
        eventDiv.innerHTML = "OFF";
    }else{
        eventDiv.classList.add('font-bold', 'text-green-500');
        eventDiv.innerHTML = "ON";
    }

    let actionDiv = document.createElement('div');
    actionDiv.classList.add('flex');

    let editIconDiv = document.createElement('div');
    editIconDiv.classList.add('px-2', 'cursor-pointer');
    editIconDiv.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 20 20"><path fill="#6366f1" d="M19.404,6.65l-5.998-5.996c-0.292-0.292-0.765-0.292-1.056,0l-2.22,2.22l-8.311,8.313l-0.003,0.001v0.003l-0.161,0.161c-0.114,0.112-0.187,0.258-0.21,0.417l-1.059,7.051c-0.035,0.233,0.044,0.47,0.21,0.639c0.143,0.14,0.333,0.219,0.528,0.219c0.038,0,0.073-0.003,0.111-0.009l7.054-1.055c0.158-0.025,0.306-0.098,0.417-0.211l8.478-8.476l2.22-2.22C19.695,7.414,19.695,6.941,19.404,6.65z M8.341,16.656l-0.989-0.99l7.258-7.258l0.989,0.99L8.341,16.656z M2.332,15.919l0.411-2.748l4.143,4.143l-2.748,0.41L2.332,15.919z M13.554,7.351L6.296,14.61l-0.849-0.848l7.259-7.258l0.423,0.424L13.554,7.351zM10.658,4.457l0.992,0.99l-7.259,7.258L3.4,11.715L10.658,4.457z M16.656,8.342l-1.517-1.517V6.823h-0.003l-0.951-0.951l-2.471-2.471l1.164-1.164l4.942,4.94L16.656,8.342z"></path>';
    editIconDiv.onclick = function(){
        showEditEventModal(id);
    }

    let trashIconDiv = document.createElement('div');
    trashIconDiv.classList.add('px-2', 'cursor-pointer');
    trashIconDiv.innerHTML = '<svg class="w-5 h-5" viewBox="0 0 20 20"><path fill="#6366f1" d="M17.114,3.923h-4.589V2.427c0-0.252-0.207-0.459-0.46-0.459H7.935c-0.252,0-0.459,0.207-0.459,0.459v1.496h-4.59c-0.252,0-0.459,0.205-0.459,0.459c0,0.252,0.207,0.459,0.459,0.459h1.51v12.732c0,0.252,0.207,0.459,0.459,0.459h10.29c0.254,0,0.459-0.207,0.459-0.459V4.841h1.511c0.252,0,0.459-0.207,0.459-0.459C17.573,4.127,17.366,3.923,17.114,3.923M8.394,2.886h3.214v0.918H8.394V2.886z M14.686,17.114H5.314V4.841h9.372V17.114z M12.525,7.306v7.344c0,0.252-0.207,0.459-0.46,0.459s-0.458-0.207-0.458-0.459V7.306c0-0.254,0.205-0.459,0.458-0.459S12.525,7.051,12.525,7.306M8.394,7.306v7.344c0,0.252-0.207,0.459-0.459,0.459s-0.459-0.207-0.459-0.459V7.306c0-0.254,0.207-0.459,0.459-0.459S8.394,7.051,8.394,7.306"></path></svg>';
    trashIconDiv.onclick = function(){
        removeEvent(id);
    }

    actionDiv.appendChild(editIconDiv);
    actionDiv.appendChild(trashIconDiv);

    row.appendChild(timeDiv);
    row.appendChild(eventDiv);
    row.appendChild(actionDiv);

    document.getElementById('events').appendChild(row);
}

function clickMenuMobileButton(){
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

function clickAddButton(){
    document.getElementById('event-modal-title').innerHTML = 'New event';
    document.getElementById('editEvent-hours').value = "00";
    document.getElementById('editEvent-minutes').value = "00";

    let eventDiv = document.getElementById('selected-event-icon');
    let eventDiv2 = document.getElementById('selected-event-label');
    
    eventDiv.classList.remove('bg-red-500');
    eventDiv2.classList.remove('text-red-500');
    eventDiv.classList.add('bg-green-500');
    eventDiv2.classList.add('text-green-500');
    eventDiv2.innerHTML = "ON";

    document.getElementById('editEvent-tailwindModal').classList.remove('hidden');

    document.getElementById("editEvent-event").classList.add('hidden');
    document.getElementById("editEvent-eventSelector").classList.remove('hidden');
}

function selectEvent(event){
    document.getElementById('editEvent-tailwindModal').classList.remove('hidden');
    let eventDiv = document.getElementById('selected-event-icon');
    let eventDiv2 = document.getElementById('selected-event-label');
    
    if(event === 0){
        eventDiv.classList.remove('bg-green-500');
        eventDiv2.classList.remove('text-green-500');
        eventDiv.classList.add('bg-red-500');
        eventDiv2.classList.add('text-red-500');
        eventDiv2.innerHTML = "OFF";
    }else{
        eventDiv.classList.remove('bg-red-500');
        eventDiv2.classList.remove('text-red-500');
        eventDiv.classList.add('bg-green-500');
        eventDiv2.classList.add('text-green-500');
        eventDiv2.innerHTML = "ON";
    }

    document.getElementById('editEvent-eventSelector-value').value = event;
    document.getElementById('select-event-options').classList.add('hidden');
}

const GetStatus = async () => {
    const response = await fetch('http://192.168.0.228/api/status');
    const data = await response.text();
    return data;
}

const SetStatus = async (status) => {
    if(status === 0){
        await fetch('http://192.168.0.228/api/off').then(response => updateStatus());
    } else if(status === 1){
        await fetch('http://192.168.0.228/api/on').then(response => updateStatus());
    }
}

const clickToggleButton = async () => {
    const status = await GetStatus();
    if(status === "OFF"){
        await SetStatus(1);
    } else if(status === 1){
        await SetStatus(0);
    }
}

const updateStatus = async () => {
    const status = await GetStatus();
    const onDiv = document.getElementById('currentState-on');
    const offDiv = document.getElementById('currentState-off');
    const switchOn = document.getElementById('switch-on');
    const switchOff = document.getElementById('switch-off');
    
    if(status === "OFF"){
        onDiv.classList.add('hidden');
        offDiv.classList.remove('hidden');
        switchOn.classList.remove('hidden');
        switchOff.classList.add('hidden');
    } else if(status === "ON"){
        onDiv.classList.remove('hidden');
        offDiv.classList.add('hidden');
        switchOn.classList.add('hidden');
        switchOff.classList.remove('hidden');
    }
}
