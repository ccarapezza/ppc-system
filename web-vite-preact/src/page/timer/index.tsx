import { useEffect, useRef, useState } from "preact/hooks";
import { PpcApi } from "../../api/PpcApi";
import { FontAwesomeIcon } from "../../components/FontAwesomeIcon"
import DigitalPin from "../../components/DigitalPin";
import Modal from "../../components/Modal";
import Button from "../../components/Button";

// Define interfaces for typed safety
interface Alarm {
    name: string;
    hour: number;
    minute: number;
    executed: boolean;
    enabled: boolean;
    extraParams: number[];
    daysOfWeek: boolean[];
}

export default function Timer() {

    const [loading, setLoading] = useState(false);
    const clockRef = useRef<HTMLSpanElement>(null);
    const clockSecRef = useRef<HTMLSpanElement>(null);
    const [time, setTime] = useState<number>(new Date().getTime());
    const [retro, setRetro] = useState<'default'|'red'|'green'|'blue'>('blue');
    const [inverse, setInverse] = useState(false);

    const alarmNameRef = useRef<HTMLInputElement>(null);
    const alarmTimeOnRef = useRef<HTMLInputElement>(null);
    const alarmTimeOffRef = useRef<HTMLInputElement>(null);
    const alarmChannelRef = useRef<HTMLSelectElement>(null);
    const alarmActionRef = useRef<HTMLSelectElement>(null);

    // References for the ON-OFF alarm modal
    const onOffAlarmNameRef = useRef<HTMLInputElement>(null);
    const onOffAlarmTimeOnRef = useRef<HTMLInputElement>(null);
    const onOffAlarmTimeOffRef = useRef<HTMLInputElement>(null);
    const onOffAlarmChannelRef = useRef<HTMLSelectElement>(null);

    const [mode, setMode] = useState<'auto'|'manual'>('auto');

    const [showModal, setShowModal] = useState(false);
    const [showOnOffModal, setShowOnOffModal] = useState(false); // State for ON-OFF alarm modal
    const [alarms, setAlarms] = useState<Alarm[]>([]);
    const [error, setError] = useState<any>({});
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // State to track which accordion items are open
    const [openAccordion, setOpenAccordion] = useState<{[key: string]: boolean}>({
        'accordion-1': false,
    });

    // Estado para los días de la semana al crear una nueva alarma
    const [newAlarmDays, setNewAlarmDays] = useState<boolean[]>([true, true, true, true, true, true, true]); // Predeterminado: todos los días activos
    // Estado para los días de la semana al crear una alarma ON-OFF
    const [onOffAlarmDays, setOnOffAlarmDays] = useState<boolean[]>([true, true, true, true, true, true, true]); // Predeterminado: todos los días activos

    // Function to toggle accordion items
    const toggleAccordion = (id: string) => {
        setOpenAccordion(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        setLoading(true);
        PpcApi.getTime().then((response: any) => {
            setTime(new Date(response.time).getTime());
            const tick = () => setTime(time => time + 1000);
            interval = setInterval(() => tick(), 1000);
        }).catch((error: any) => {
            console.error(error);
        }).finally(() => {
            setLoading(false);
        });

        return () => interval && clearInterval(interval);
    }, []);

    function renderClock(){
        if(time==0||loading) return;
        const now = new Date(time);
        const clock = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
        const clockSec = now.getSeconds().toString().padStart(2, '0');
        if(clockRef.current && clockSecRef.current){
            clockRef.current.innerText = clock;
            clockSecRef.current.innerText = clockSec;
            setTimeout(() => {
                if(clockRef.current){
                    clockRef.current.innerText = clockRef.current!.innerText.replace(":", " ");
                }
            }, 500);
        }
    }

    const getAlarms = () => {
        setLoading(true);
        PpcApi.getAlarms().then((response: any) => {
            console.log(response);
            setAlarms(response);
        }).catch((error: any) => {
            console.error(error);
        }).finally(() => {
            setLoading(false);
        });
    }

    const clearErrors = () => {
        setError({});
        setErrorMessage("");
    }

    const resetForm = () => {
        if (alarmNameRef.current) alarmNameRef.current.value = "";
        if (alarmTimeOnRef.current) alarmTimeOnRef.current.value = ""; // Esto limpiará el input de tipo time
        if (alarmTimeOffRef.current) alarmTimeOffRef.current.value = "";
        if (alarmChannelRef.current) alarmChannelRef.current.value = "1";
        if (alarmActionRef.current) alarmActionRef.current.value = "on";
        setNewAlarmDays([true, true, true, true, true, true, true]); // Reset to all days active
        clearErrors();
    }

    const createAlarm = () => {
        // Validate inputs
        setErrorMessage("");
        const alarmName = alarmNameRef.current?.value.trim() || "";
        const timeOnValue = alarmTimeOnRef.current?.value.trim() || "";
        const [hourStr, minuteStr] = timeOnValue.split(":");
        const hour = parseInt(hourStr || "0", 10);
        const minute = parseInt(minuteStr || "0", 10);
        const channel = parseInt(alarmChannelRef.current?.value.trim() || "", 10);
        const action = alarmActionRef.current?.value.trim() === "on" ? true : false;

        /*
        const timeOffValue = alarmTimeOffRef.current?.value.trim() || "";
        const [hourOffStr, minuteOffStr] = timeOffValue.split(":");
        const hourOff = parseInt(hourOffStr || "0", 10);
        const minuteOff = parseInt(minuteOffStr || "0", 10);
        */
        

        let valid = true;
        
        if (!alarmName) {
            setError( (oldError: any) => {
                return {
                    ...oldError,
                    alarmName: "Alarm name is required."
                }
            })
            valid = false;
        }
        
        if (!timeOnValue || isNaN(hour) || hour < 0 || hour > 23) {
            setError( (oldError: any) => {
                return {
                    ...oldError,
                    hour: "Valid time is required (00-23 hours)."
                }
            })
            valid = false;
        }
        
        if (isNaN(minute) || minute < 0 || minute > 59) {
            setError( (oldError: any) => {
                return {
                    ...oldError,
                    minute: "Valid time is required (00-59 minutes)."
                }
            })
            valid = false;
        }
        
        if (isNaN(channel) || channel < 1 || channel > 3) {
            setError( (oldError: any) => {
                return {
                    ...oldError,
                    channel: "Channel must be a number between 1 and 3."
                }
            })
            valid = false;
        }

        if (newAlarmDays.every((day) => !day)) {
            setError( (oldError: any) => {
                return {
                    ...oldError,
                    daysOfWeek: "At least one day must be selected."
                }
            })
            valid = false;
        }

        if (!valid) {
            return;
        }

        setLoading(true);
        
        // Crear la alarma enviando los días seleccionados
        PpcApi.createAlarm({
            hour: hour,
            minute: minute,
            name: alarmName,
            channel: channel,
            action: action,
            days: newAlarmDays  // Enviar los días seleccionados directamente
        })
        .then((response: any) => {
            if (response.success) {
                // Limpiar formulario y cerrar modal al tener éxito
                resetForm();
                // Ya no necesitamos resetear los días aquí, porque resetForm() ya lo hace
                setErrorMessage("");
                setShowModal(false);
                // Actualizar lista de alarmas
                getAlarms();
            } else {
                setErrorMessage(response.message || "Failed to create alarm");
            }
        })
        .catch((error: any) => {
            console.error(error);
            setErrorMessage(error.message || "Error creating alarm");
        })
        .finally(() => {
            setLoading(false);
        });
    }

    // Reset form for ON-OFF alarm
    const resetOnOffForm = () => {
        if (onOffAlarmNameRef.current) onOffAlarmNameRef.current.value = "";
        if (onOffAlarmTimeOnRef.current) onOffAlarmTimeOnRef.current.value = "";
        if (onOffAlarmTimeOffRef.current) onOffAlarmTimeOffRef.current.value = "";
        if (onOffAlarmChannelRef.current) onOffAlarmChannelRef.current.value = "1";
        setOnOffAlarmDays([true, true, true, true, true, true, true]); // Reset to all days active
        clearErrors();
    }

    const createOnOffAlarm = () => {
        // Validate inputs
        setErrorMessage("");
        const alarmName = onOffAlarmNameRef.current?.value.trim() || "";
        
        // Time ON validation
        const timeOnValue = onOffAlarmTimeOnRef.current?.value.trim() || "";
        const [onHourStr, onMinuteStr] = timeOnValue.split(":");
        const onHour = parseInt(onHourStr || "0", 10);
        const onMinute = parseInt(onMinuteStr || "0", 10);
        
        // Time OFF validation
        const timeOffValue = onOffAlarmTimeOffRef.current?.value.trim() || "";
        const [offHourStr, offMinuteStr] = timeOffValue.split(":");
        const offHour = parseInt(offHourStr || "0", 10);
        const offMinute = parseInt(offMinuteStr || "0", 10);
        
        const channel = parseInt(onOffAlarmChannelRef.current?.value.trim() || "", 10);

        let valid = true;
        
        if (!alarmName) {
            setError((oldError: any) => ({
                ...oldError,
                alarmName: "Alarm name is required."
            }));
            valid = false;
        }
        
        if (!timeOnValue || isNaN(onHour) || onHour < 0 || onHour > 23) {
            setError((oldError: any) => ({
                ...oldError,
                onHour: "Valid time is required (00-23 hours)."
            }));
            valid = false;
        }
        
        if (isNaN(onMinute) || onMinute < 0 || onMinute > 59) {
            setError((oldError: any) => ({
                ...oldError,
                onMinute: "Valid time is required (00-59 minutes)."
            }));
            valid = false;
        }
        
        if (!timeOffValue || isNaN(offHour) || offHour < 0 || offHour > 23) {
            setError((oldError: any) => ({
                ...oldError,
                offHour: "Valid time is required (00-23 hours)."
            }));
            valid = false;
        }
        
        if (isNaN(offMinute) || offMinute < 0 || offMinute > 59) {
            setError((oldError: any) => ({
                ...oldError,
                offMinute: "Valid time is required (00-59 minutes)."
            }));
            valid = false;
        }
        
        if (isNaN(channel) || channel < 1 || channel > 3) {
            setError((oldError: any) => ({
                ...oldError,
                channel: "Channel must be a number between 1 and 3."
            }));
            valid = false;
        }

        if (onOffAlarmDays.every((day) => !day)) {
            setError((oldError: any) => ({
                ...oldError,
                daysOfWeek: "At least one day must be selected."
            }));
            valid = false;
        }

        if (!valid) {
            return;
        }

        setLoading(true);
        
        // Crear alarmas ON/OFF
        PpcApi.createAlarmOnOff({
            name: alarmName,
            onHour: onHour,
            onMinute: onMinute,
            offHour: offHour,
            offMinute: offMinute,
            channel: channel,
            days: onOffAlarmDays
        })
        .then((response: any) => {
            if (response.success) {
                // Limpiar formulario y cerrar modal al tener éxito
                resetOnOffForm();
                setErrorMessage("");
                setShowOnOffModal(false);
                // Actualizar lista de alarmas
                getAlarms();
            } else {
                setErrorMessage(response.message || "Failed to create ON/OFF alarms");
            }
        })
        .catch((error: any) => {
            console.error(error);
            setErrorMessage(error.message || "Error creating ON/OFF alarms");
        })
        .finally(() => {
            setLoading(false);
        });
    }

    useEffect(() => {
        renderClock();
    }, [time]);

    // Load alarms when component mounts
    useEffect(() => {
        getAlarms();
    }, []);

    // Function to toggle alarm enabled status
    const toggleAlarmEnabled = (alarm: Alarm) => {
        setLoading(true);
        PpcApi.enableAlarm(alarm.name, !alarm.enabled)
            .then((response: any) => {
                if (response.success) {
                    getAlarms(); // Refresh alarms list
                } else {
                    setErrorMessage(response.message || "Failed to update alarm");
                }
            })
            .catch((error: any) => {
                console.error(error);
                setErrorMessage("Error updating alarm");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Function to open the edit modal for an alarm
    const openEditModal = (alarm?: Alarm) => {
        setSelectedAlarm(alarm || null);
        setShowEditModal(true);
        clearErrors();
    };
    
    const openOnOffModal = () => {
        setShowOnOffModal(true);
        clearErrors();
        resetOnOffForm();
    }
    
    // Function to update alarm days
    const updateAlarmDays = (days: boolean[]) => {
        if (!selectedAlarm) return;
        
        setLoading(true);
        PpcApi.setAlarmDays(selectedAlarm.name, days)
            .then((response: any) => {
                if (response.success) {
                    setShowEditModal(false);
                    getAlarms(); // Refresh alarms list
                } else {
                    setErrorMessage(response.message || "Failed to update alarm days");
                }
            })
            .catch((error: any) => {
                console.error(error);
                setErrorMessage("Error updating alarm days");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Week day names for the UI
    const weekDays = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

    const nextEvent = alarms.filter((alarm) => !alarm?.executed)[0] || null;

    return (<>
            <div className="flex justify-between items-center p-2 mb-2">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon="stopwatch" className="text-gray-800 dark:text-white" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Timer</h1>
                </div>
                <div className="flex items-center gap-2 text-gray-800 dark:text-white">
                    {new Intl.DateTimeFormat(undefined, { day:'2-digit', month: '2-digit', year: '2-digit' }).format(new Date(time)).replace(/\//g, "-")}
                    <FontAwesomeIcon icon={"calendar"}/>
                </div>
            </div>
            <div class="p-2">
                <div class="flex items-center justify-between">
                    <div class="text-gray-500 text-xs w-full">
                        {loading &&
                            <div class="flex items-center gap-2">
                                <FontAwesomeIcon icon="circle-notch" className="animate-spin text-gray-800" />
                                <span>Cargando...</span>
                            </div>
                        }

                        {!loading &&
                            <div class="flex flex-col gap-2 justify-center items-center">
                                <div className="hidden flex justify-center gap-2 m-4">
                                    <button 
                                        type="button"
                                        onClick={() => setRetro('default')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${retro === 'default' ? 'bg-gray-600 text-gray-800 dark:text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                        Default
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setRetro('green')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${retro === 'green' ? 'bg-green-600 text-gray-800 dark:text-white' : 'bg-green-100 text-green-700'}`}
                                    >
                                        Green
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setRetro('red')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${retro === 'red' ? 'bg-red-600 text-gray-800 dark:text-white' : 'bg-red-100 text-red-700'}`}
                                    >
                                        Red
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRetro('blue')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${retro === 'blue' ? 'bg-blue-600 text-gray-800 dark:text-white' : 'bg-blue-100 text-blue-700'}`}
                                    >
                                        Blue
                                    </button>
                                </div>
                                <div class="hidden flex justify-center m-2">
                                    <button 
                                        type="button"
                                        onClick={() => setInverse(!inverse)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${inverse ? 'bg-gray-600 text-gray-800 dark:text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                        Inverse
                                    </button>
                                </div>

                                <div class="flex flex-col gap-4 justify-center py-2 mb-2 w-full items-center">
                                    <div className="flex justify-center gap-2 mb-2 w-full xl:max-w-xl text-xl text-gray-800 dark:text-white hidden">
                                        <button 
                                            type="button"
                                            onClick={() => setMode('auto')}
                                            className={`px-3 py-1 text-xl font-semibold rounded-md w-full ${mode === 'auto' ? 'border border-gray-500 text-gray-700' : 'border border-gray-100 bg-primary text-gray-800 dark:text-white'}`}
                                        >
                                            Auto
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setMode('manual')}
                                            className={`px-3 py-1 text-xl font-semibold rounded-md w-full ${mode === 'manual' ? 'border border-gray-500 text-gray-700' : 'border border-gray-100 bg-primary text-gray-800 dark:text-white'}`}
                                        >
                                            Manual
                                        </button>
                                    </div>

                                    <div className={`flex w-full justify-between items-center px-4 mb-2 border rounded-md ${mode === 'auto' ? 'border-gray-200' : 'border-gray-700'}`}>
                                        <div className="w-fit">
                                            <DigitalPin id={0} name="Sala 1" hideControl={mode === 'auto'} hideState={mode === 'manual'} />
                                            <DigitalPin id={1} name="Sala 2" hideControl={mode === 'auto'} hideState={mode === 'manual'} />
                                            <DigitalPin id={2} name="Sala 3" hideControl={mode === 'auto'} hideState={mode === 'manual'} />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const dropdown = document.getElementById('timer-dropdown');
                                                if (dropdown) {
                                                    dropdown.classList.toggle('hidden');
                                                }
                                            }}
                                            className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                        >
                                            <FontAwesomeIcon icon="ellipsis-vertical" className="text-xl" />
                                        </button>
                                        <div id="timer-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                            <div className="py-1">
                                                {mode === 'auto' && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            setMode('manual');
                                                            const dropdown = document.getElementById('timer-dropdown');
                                                            if (dropdown) dropdown.classList.add('hidden');
                                                        }}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Modo Manual
                                                    </button>
                                                )}
                                                {mode === 'manual' && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            setMode('auto');
                                                            const dropdown = document.getElementById('timer-dropdown');
                                                            if (dropdown) dropdown.classList.add('hidden');
                                                        }}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Modo Auto
                                                    </button>
                                                )}
                                            </div>
                                        </div>    
                                    </div>

                                    <div className={`${retro}-lcd ${inverse ? 'inverse' : ''}`}>
                                        <div class="clock-background w-full">
                                            <div class="flex align-center p-4 justify-center items-center clock-wrapper w-full text-nowrap relative">
                                                <div class="absolute inset-0 flex items-center justify-center w-full text-center D7MBI clock-time-background z-0">
                                                    <span class="text-7xl md:text-8xl">88:88</span>
                                                    <span class="ml-1 text-2xl hidden">88</span>
                                                </div>
                                                <div class="relative w-full text-center D7MBI clock-time z-1">
                                                    <span id="clock" class="text-7xl md:text-8xl w-full" ref={clockRef}>!! !!</span>
                                                    <span id="clock-sec" class="ml-1 text-2xl hidden" ref={clockSecRef}>!!</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {nextEvent && 
                                    <div class="flex gap-2 justify-between items-center p-2 mb-2 w-full xl:max-w-xl text-xl text-gray-800 dark:text-white mt-2 border rounded-lg bg-gray-100 dark:bg-gray-800 drop-shadow-md">
                                        <div class={'flex'}>
                                            Próximo evento {nextEvent ? ` - ${nextEvent.name}` : ''}
                                        </div> 
                                        <div class="flex items-center gap-2">
                                            <div class="w-full text-center text-sm">
                                                {nextEvent.hour.toString().padStart(2, '0')}:{nextEvent.minute.toString().padStart(2, '0')}
                                            </div>
                                            {nextEvent.extraParams[1] === 1 ?
                                                <div id="currentState-on" class="flex align-center px-2 justify-center items-center">
                                                    <div class="bg-green-500 w-3 h-3 rounded-full">&nbsp;</div>
                                                    <span class="text-green-500 font-bold pl-2 text-sm">ON</span>
                                                </div>
                                                : 
                                                <div id="currentState-off" class="flex align-center px-2 justify-center items-center">
                                                    <div class="bg-red-500 w-3 h-3 rounded-full d-flex">&nbsp;</div>
                                                    <span class="text-red-500 font-bold pl-2 text-sm">OFF</span>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }
                                
                                <div id="accordion-example" class={"w-full border border-gray-200 dark:border-gray-700 rounded-xl"}>
                                    <h2 id="accordion-example-heading-1">
                                        <button 
                                            type="button" 
                                            class="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" 
                                            aria-expanded={openAccordion['accordion-1'] ? "true" : "false"} 
                                            aria-controls="accordion-example-body-1"
                                            onClick={() => toggleAccordion('accordion-1')}
                                            disabled={loading || alarms.length === 0}
                                        >
                                            {alarms.length === 0 ? 
                                                <div class="flex justify-center items-center gap-2"><FontAwesomeIcon icon="bell" className={"w-4 h-4"} />No hay eventos</div>
                                                :
                                                <>
                                                    <div class="flex justify-center items-center text-xl gap-2"><FontAwesomeIcon icon="bell" className={"w-4 h-4"} /> Eventos <span className={"bg-gray-300 px-2 rounded font-bold text-gray-800 dark:text-white"}>{alarms.length}</span></div>
                                                    <FontAwesomeIcon icon="chevron-down" className={`w-4 h-4 ${openAccordion['accordion-1'] ? 'rotate-180' : 'rotate-0'} shrink-0 transition-transform`}  />
                                                </>
                                            }
                                        </button>
                                    </h2>
                                    <div 
                                        id="accordion-example-body-1" 
                                        class={`w-full overflow-hidden transition-all duration-300 ${
                                            openAccordion['accordion-1'] 
                                                ? "opacity-100" 
                                                : "max-h-0 opacity-0"
                                        }`}
                                        aria-labelledby="accordion-example-heading-1"
                                    >
                                        {/* List of alarms */}
                                        {alarms.length > 0 && (
                                            <div className="w-full mb-4  p-4">
                                                <ul className="divide-y divide-gray-200 border-t">
                                                    {alarms.map((alarm, index) => (
                                                        <li key={index} className="py-2">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div className={"flex flex-col gap-1 p-2 w-full justify-center items-center"}>
                                                                    <span className="text-xl">{alarm.name}</span>
                                                                    <div className={"flex flex-col gap-2 items-center"}>
                                                                        <div className="text-sm text-gray-600 flex items-center gap-2 text-xl">
                                                                            <FontAwesomeIcon icon="clock"/><time>{alarm.hour.toString().padStart(2, '0')}:{alarm.minute.toString().padStart(2, '0')}</time>
                                                                        </div>
                                                                        <div className="text-sm text-gray-600 flex items-center gap-1 border-2 border-gray-200 px-2 rounded-md w-fit">
                                                                            <span className={"px-2"}>Sala {alarm.extraParams[0]}</span>
                                                                            <FontAwesomeIcon icon="right-long" />
                                                                            {alarm.extraParams[1] === 1 ?
                                                                                <div id="currentState-on" class="flex align-center px-2 justify-center items-center">
                                                                                    <div class="bg-green-500 w-3 h-3 rounded-full">&nbsp;</div>
                                                                                    <span class="text-green-500 font-bold pl-2 text-sm">ON</span>
                                                                                </div>
                                                                                : 
                                                                                <div id="currentState-off" class="flex align-center px-2 justify-center items-center">
                                                                                    <div class="bg-red-500 w-3 h-3 rounded-full d-flex">&nbsp;</div>
                                                                                    <span class="text-red-500 font-bold pl-2 text-sm">OFF</span>
                                                                                </div>
                                                                            }
                                                                        </div>

                                                                    </div>
                                                                    {/* Display active days */}
                                                                    <div className="flex flex-wrap gap-1 my-1 items-center gap-2 text-xl">
                                                                        <FontAwesomeIcon icon="calendar" />
                                                                        {weekDays.map((day, idx) => (
                                                                            <span 
                                                                                key={idx}
                                                                                className={`text-xs px-1 py-0.5 rounded ${
                                                                                    alarm.daysOfWeek[idx]
                                                                                        ? 'bg-blue-100 text-blue-800'
                                                                                        : 'bg-gray-100 text-gray-400'
                                                                                }`}
                                                                            >
                                                                                {day}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                
                                                            </div>
                                                            <div className="flex items-end gap-2 w-full justify-between">
                                                                <div>
                                                                    <div className={`flex gap-1 items-center px-2 py-1 rounded-md text-sm ${alarm.executed ? 'text-green-600' : 'text-yellow-800'}`}>
                                                                        <FontAwesomeIcon icon="check" />{alarm.executed ? 'Executed' : 'Pending'}
                                                                    </div>
                                                                    {!alarm.enabled && (
                                                                        <div className={`flex gap-1 items-center px-2 py-1 rounded-md text-sm text-red-600`}>
                                                                            <FontAwesomeIcon icon="exclamation-triangle" />Disabled
                                                                        </div>
                                                                    )}
                                                                    
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {/*
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleAlarmEnabled(alarm)}
                                                                        className={`px-2 py-1 rounded-md text-sm ${alarm.enabled ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                                                                    >
                                                                        {alarm.enabled ? 'Disable' : 'Enable'}
                                                                    </button>
                                                                    */}
                                                                    {/* new Checkbox Implementation */}
                                                                    <div className="flex items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={alarm.enabled}
                                                                            onChange={() => toggleAlarmEnabled(alarm)}
                                                                            className={`form-checkbox h-5 w-5 ${alarm.enabled ? 'text-green-600' : 'text-red-600'} focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 rounded`}
                                                                        />
                                                                        <span className={`ml-2 text-sm ${alarm.enabled ? 'text-green-600' : 'text-red-600'}`}>
                                                                            {alarm.enabled ? 'Enabled' : 'Disabled'}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openEditModal(alarm)}
                                                                        className="px-2 py-1 rounded-md text-sm text-blue-600"
                                                                    >
                                                                        <FontAwesomeIcon icon="edit" className="text-xl" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            
                                                            
                                                            {/* Action buttons */}
                                                            <div className="flex items-center gap-2 mt-2 justify-end">
                                                                
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2 mb-4">
                                    <button id="addEvent" type="button" onClick={() => openOnOffModal()} class="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 w-full">
                                        <FontAwesomeIcon icon="plus" className={"w-4 h-4"} />
                                        <span class="ml-2">Crear Alarma</span>
                                    </button>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            <Modal
                title="Nuevo"
                open={showModal}
                onClose={() => {
                    setShowModal(false);
                    clearErrors();
                    resetForm();
                }}
                actions={
                    <div class="w-full flex justify-between items-center gap-4">
                        <Button
                            label="Cancelar"
                            onClick={() => setShowModal(false)}
                            className="bg-gray-200 text-gray-800"
                        />
                        <Button
                            label="Crear"
                            onClick={createAlarm}
                            className="bg-green-600 text-white"
                        />
                    </div>
                }
            >
                <div className="space-y-4">
                    {errorMessage && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-md">
                            {errorMessage}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alarm-name">
                            Nombre
                        </label>
                        <input
                            ref={alarmNameRef}
                            id="alarm-name"
                            type="text"
                            placeholder="Nombre"
                            className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${error.alarmName ? 'border-red-500' : ''}`}
                            
                        />
                    </div>
                    <div className="w-full">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alarm-time">
                            Encendido
                        </label>
                        <input
                            ref={alarmTimeOnRef} 
                            id="alarm-time"
                            type="time"
                            className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${error.hour || error.minute ? 'border-red-500' : ''}`}
                        />
                        {(error.hour || error.minute) && (
                            <p className="text-red-500 text-xs italic mt-1">{error.hour || error.minute}</p>
                        )}
                    </div>
                    <div className="w-full">
                        <input type="checkbox" checked={false} class="sr-only peer" />

                    </div>
                    <div className="w-full">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alarm-time">
                            Apagado
                        </label>
                        <input
                            ref={alarmTimeOffRef} 
                            id="alarm-time"
                            type="time"
                            className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${error.hour || error.minute ? 'border-red-500' : ''}`}
                        />
                        {(error.hour || error.minute) && (
                            <p className="text-red-500 text-xs italic mt-1">{error.hour || error.minute}</p>
                        )}
                    </div>
                    <hr />
                    

                    {/* Active Days Section */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-gray-700 text-sm font-bold mb-6 flex justify-between items-center w-full">
                                <span>Días Activos</span>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const dropdown = document.getElementById('days-preset-dropdown');
                                        if (dropdown) {
                                            dropdown.classList.toggle('hidden');
                                        }
                                    }}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    <FontAwesomeIcon icon="ellipsis-vertical" className="text-xl" />
                                </button>
                            </label>
                            <div className="relative">
                                <div id="days-preset-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                    <div className="py-1">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setNewAlarmDays([true, true, true, true, true, true, true]);
                                                const dropdown = document.getElementById('days-preset-dropdown');
                                                if (dropdown) dropdown.classList.add('hidden');
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Todos los Días
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setNewAlarmDays([false, true, true, true, true, true, false]);
                                                const dropdown = document.getElementById('days-preset-dropdown');
                                                if (dropdown) dropdown.classList.add('hidden');
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Lunes a Viernes
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setNewAlarmDays([true, false, false, false, false, false, true]);
                                                const dropdown = document.getElementById('days-preset-dropdown');
                                                if (dropdown) dropdown.classList.add('hidden');
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Fines de Semana
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-nowrap justify-center gap-2 mb-3">
                            {weekDays.map((day, index) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                        const newDays = [...newAlarmDays];
                                        newDays[index] = !newDays[index];
                                        setNewAlarmDays(newDays);
                                    }}
                                    className={`px-1.5 py-1 text-sm font-semibold rounded-md ${
                                        newAlarmDays[index] 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Edit Alarm Days Modal */}
            <Modal
                title={`Edit Days for ${selectedAlarm?.name || ''}`}
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                actions={
                    <div class="w-full flex justify-between items-center gap-4">
                        <Button
                            label="Cancel"
                            onClick={() => setShowEditModal(false)}
                            className="bg-gray-200 text-gray-800"
                        />
                        <Button
                            label="Save Changes"
                            onClick={() => selectedAlarm && updateAlarmDays(selectedAlarm.daysOfWeek)}
                            className="bg-blue-600 text-white"
                        />
                    </div>
                }
            >
                <div className="space-y-4">
                    {errorMessage && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-md">
                            {errorMessage}
                        </div>
                    )}
                    
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Active Days
                            </label>
                            <div className="relative">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const dropdown = document.getElementById('edit-days-preset-dropdown');
                                        if (dropdown) {
                                            dropdown.classList.toggle('hidden');
                                        }
                                    }}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    <FontAwesomeIcon icon="ellipsis-vertical" />
                                </button>
                                <div id="edit-days-preset-dropdown" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                    <div className="py-1">
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                if (selectedAlarm) {
                                                    setSelectedAlarm({
                                                        ...selectedAlarm,
                                                        daysOfWeek: [true, true, true, true, true, true, true]
                                                    });
                                                    const dropdown = document.getElementById('edit-days-preset-dropdown');
                                                    if (dropdown) dropdown.classList.add('hidden');
                                                }
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Todos los Días
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                if (selectedAlarm) {
                                                    setSelectedAlarm({
                                                        ...selectedAlarm,
                                                        daysOfWeek: [false, true, true, true, true, true, false]
                                                    });
                                                    const dropdown = document.getElementById('edit-days-preset-dropdown');
                                                    if (dropdown) dropdown.classList.add('hidden');
                                                }
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Lunes a Viernes
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                if (selectedAlarm) {
                                                    setSelectedAlarm({
                                                        ...selectedAlarm,
                                                        daysOfWeek: [true, false, false, false, false, false, true]
                                                    });
                                                    const dropdown = document.getElementById('edit-days-preset-dropdown');
                                                    if (dropdown) dropdown.classList.add('hidden');
                                                }
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Fines de Semana
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            Select the days on which this alarm should be active:
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                            {selectedAlarm && weekDays.map((day, index) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                        const newDays = [...selectedAlarm.daysOfWeek];
                                        newDays[index] = !newDays[index];
                                        setSelectedAlarm({
                                            ...selectedAlarm,
                                            daysOfWeek: newDays
                                        });
                                    }}
                                    className={`px-3 py-1 text-xs font-semibold rounded-md ${
                                        selectedAlarm.daysOfWeek[index] 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Alarm Status
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => selectedAlarm && toggleAlarmEnabled(selectedAlarm)}
                                className={`px-3 py-1 text-sm font-semibold rounded-md ${
                                    selectedAlarm?.enabled 
                                        ? 'bg-red-600 text-white hover:bg-red-700' 
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                {selectedAlarm?.enabled ? 'Disable Alarm' : 'Enable Alarm'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ON-OFF Alarm Modal */}
            <Modal
                title="Crear alarma ON/OFF"
                open={showOnOffModal}
                onClose={() => {
                    setShowOnOffModal(false);
                    clearErrors();
                    resetOnOffForm();
                }}
                actions={
                    <div class="w-full flex justify-between items-center gap-4">
                        <Button
                            label="Cancelar"
                            onClick={() => setShowOnOffModal(false)}
                            className="bg-gray-200 text-gray-800"
                        />
                        <Button
                            label="Crear"
                            onClick={createOnOffAlarm}
                            className="bg-blue-600 text-white"
                        />
                    </div>
                }
            >
                <div className="space-y-4">
                    {errorMessage && (
                        <div className="p-3 bg-red-100 text-red-700 rounded-md">
                            {errorMessage}
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="onoff-alarm-name">
                            Nombre
                        </label>
                        <input
                            ref={onOffAlarmNameRef}
                            id="onoff-alarm-name"
                            type="text"
                            placeholder="Nombre"
                            className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${error.alarmName ? 'border-red-500' : ''}`}
                        />
                        {error.alarmName && (
                            <p className="text-red-500 text-xs italic mt-1">{error.alarmName}</p>
                        )}
                    </div>
                    
                    <div className="w-full">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="onoff-alarm-time-on">
                            Hora de encendido
                        </label>
                        <input
                            ref={onOffAlarmTimeOnRef} 
                            id="onoff-alarm-time-on"
                            type="time"
                            className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${error.onHour || error.onMinute ? 'border-red-500' : ''}`}
                        />
                        {(error.onHour || error.onMinute) && (
                            <p className="text-red-500 text-xs italic mt-1">{error.onHour || error.onMinute}</p>
                        )}
                    </div>
                    
                    <div className="w-full">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="onoff-alarm-time-off">
                            Hora de apagado
                        </label>
                        <input
                            ref={onOffAlarmTimeOffRef} 
                            id="onoff-alarm-time-off"
                            type="time"
                            className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${error.offHour || error.offMinute ? 'border-red-500' : ''}`}
                        />
                        {(error.offHour || error.offMinute) && (
                            <p className="text-red-500 text-xs italic mt-1">{error.offHour || error.offMinute}</p>
                        )}
                    </div>
                    
                    <div className="w-full">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="onoff-alarm-channel">
                            Canal
                        </label>
                        <select
                            ref={onOffAlarmChannelRef}
                            id="onoff-alarm-channel"
                            className={`w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${error.channel ? 'border-red-500' : ''}`}
                        >
                            <option value="1">Canal 1</option>
                            <option value="2">Canal 2</option>
                            <option value="3">Canal 3</option>
                        </select>
                        {error.channel && (
                            <p className="text-red-500 text-xs italic mt-1">{error.channel}</p>
                        )}
                    </div>
                    
                    <hr />
                    
                    {/* Active Days Section */}
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Días Activos
                            </label>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {weekDays.map((day, index) => (
                                <button
                                    key={`onoff-day-${index}`}
                                    type="button"
                                    onClick={() => {
                                        const newDays = [...onOffAlarmDays];
                                        newDays[index] = !newDays[index];
                                        setOnOffAlarmDays(newDays);
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                                        onOffAlarmDays[index]
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                        {error.daysOfWeek && (
                            <p className="text-red-500 text-xs italic mt-1">{error.daysOfWeek}</p>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    )
}
