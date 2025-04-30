import { useEffect, useRef, useState } from "preact/hooks";
import { PpcApi } from "../../api/PpcApi";
import { FontAwesomeIcon } from "../../components/FontAwesomeIcon"
import DigitalPin from "../../components/DigitalPin";
import Modal from "../../components/Modal";
import Button from "../../components/Button";


export default function Timer() {

    const [loading, setLoading] = useState(false);
    const clockRef = useRef<HTMLSpanElement>(null);
    const clockSecRef = useRef<HTMLSpanElement>(null);
    const [time, setTime] = useState<number>(new Date().getTime());
    const [retro, setRetro] = useState<'default'|'red'|'green'|'blue'>('blue');
    const [inverse, setInverse] = useState(false);

    const alarmNameRef = useRef<HTMLInputElement>(null);
    const alarmHourRef = useRef<HTMLInputElement>(null);
    const alarmMinuteRef = useRef<HTMLInputElement>(null);
    const alarmChannelRef = useRef<HTMLSelectElement>(null);
    const alarmActionRef = useRef<HTMLSelectElement>(null);

    const [mode, setMode] = useState<'auto'|'manual'>('auto');

    const [showModal, setShowModal] = useState(false);
    const [alarms, setAlarms] = useState<any[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    
    // State to track which accordion items are open
    const [openAccordion, setOpenAccordion] = useState<{[key: string]: boolean}>({
        'accordion-1': false,
    });

    // Function to toggle accordion items
    const toggleAccordion = (id: string) => {
        setOpenAccordion(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        let interval: number;
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

    const resetForm = () => {
        if (alarmNameRef.current) alarmNameRef.current.value = "";
        if (alarmHourRef.current) alarmHourRef.current.value = "0";
        if (alarmMinuteRef.current) alarmMinuteRef.current.value = "0";
    }

    const createAlarm = () => {
        // Validate inputs
        setErrorMessage("");
        const alarmName = alarmNameRef.current?.value.trim();
        const hour = parseInt(alarmHourRef.current?.value.trim() || "0", 10);
        const minute = parseInt(alarmMinuteRef.current?.value.trim() || "0", 10);
        const channel = parseInt(alarmChannelRef.current?.value.trim() || "0", 10);
        const action = alarmActionRef.current?.value.trim() === "on" ? true : false;

        
        if (!alarmName) {
            setErrorMessage("Please enter an alarm name.");
            return;
        }
        
        if (isNaN(hour) || hour < 0 || hour > 23) {
            setErrorMessage("Hour must be a number between 0 and 23.");
            return;
        }
        
        if (isNaN(minute) || minute < 0 || minute > 59) {
            setErrorMessage("Minute must be a number between 0 and 59.");
            return;
        }

        setLoading(true);
        PpcApi.createAlarm({
            hour: hour,
            minute: minute,
            name: alarmName,
            channel: channel,
            action: action
        }).then((response: any) => {
            console.log(response);
            if (response.success) {
                // Clear form and close modal on success
                resetForm();
                setErrorMessage("");
                setShowModal(false);
                // Refresh alarms list
                getAlarms();
            } else {
                setErrorMessage(response.message || "Failed to create alarm");
            }
        })
        .catch((error: any) => {
            console.error(error);
            setErrorMessage("Error creating alarm");
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

                                <div class="flex flex-col gap-4 justify-center p-2 mb-2 w-full items-center">
                                    <div className="flex justify-center gap-2 mb-2 w-full xl:max-w-xl text-xl text-gray-800 dark:text-white">
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

                                    <DigitalPin id={0} name="Luz MAIN" disabled={mode === 'auto'} />

                                    <div className={`${retro}-lcd ${inverse ? 'inverse' : ''}`}>
                                        <div class="clock-background w-full">
                                            <div class="flex align-center p-4 justify-center items-center clock-wrapper w-full text-nowrap">
                                                <div class="w-full text-center D7MBI clock-time"><span id="clock" class="text-7xl md:text-8xl w-full" ref={clockRef}>!! !!</span><span id="clock-sec" class="ml-1 text-2xl hidden" ref={clockSecRef}>!!</span></div>
                                                <div class="w-full text-center D7MBI clock-time-background"><span class="text-7xl md:text-8xl">88:88</span><span class="ml-1 text-2xl hidden">88</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {nextEvent && 
                                    <div class="flex gap-2 justify-between items-center p-2 mb-2 w-full xl:max-w-xl text-xl text-gray-800 dark:text-white mt-12">
                                        <div class={'flex'}>
                                            Next Event {nextEvent ? ` - ${nextEvent.name}` : ''}
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
                                
                                <div id="accordion-example" class={"w-full"}>
                                    <h2 id="accordion-example-heading-1">
                                        <button 
                                            type="button" 
                                            class="flex items-center justify-between w-full p-5 font-medium rtl:text-right text-gray-500 border border-b-0 border-gray-200 rounded-t-xl focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" 
                                            aria-expanded={openAccordion['accordion-1'] ? "true" : "false"} 
                                            aria-controls="accordion-example-body-1"
                                            onClick={() => toggleAccordion('accordion-1')}
                                        >
                                            <div class="flex justify-center items-center gap-2"><FontAwesomeIcon icon="bell" className={"w-4 h-4"} />Current Alarms</div>
                                            <FontAwesomeIcon icon="chevron-down" className={`w-4 h-4 ${openAccordion['accordion-1'] ? 'rotate-180' : 'rotate-0'} shrink-0 transition-transform`}  />
                                        </button>
                                    </h2>
                                    <div 
                                        id="accordion-example-body-1" 
                                        class={openAccordion['accordion-1'] ? "block" : "hidden"}
                                        aria-labelledby="accordion-example-heading-1"
                                    >
                                        {/* List of alarms */}
                                        {alarms.length > 0 && (
                                            <div className="w-full xl:max-w-xl mb-4 border rounded p-4">
                                                <ul className="divide-y divide-gray-200">
                                                    {alarms.map((alarm, index) => (
                                                        <li key={index} className="py-2 flex justify-between items-center">
                                                            <div>
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
                                                                <span className="font-medium">{alarm.name}</span>
                                                                <div className="text-sm text-gray-600">
                                                                    {alarm.hour.toString().padStart(2, '0')}:{alarm.minute.toString().padStart(2, '0')}
                                                                </div>
                                                            </div>
                                                            <div className={`px-2 py-1 rounded-md text-sm ${alarm.executed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {alarm.executed ? 'Executed' : 'Pending'}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>


                                <button id="addEvent" type="button"
                                    onClick={() => setShowModal(true)}
                                    class="mt-2 mb-4 inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-gray-800 dark:text-white shadow-sm hover:bg-green-500">
                                    <svg class="h-6 w-6 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                        stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span class="ml-2">Add Event</span>
                                </button>
                            </div>
                        }
                    </div>
                </div>
            </div>

            {/* Add Event Modal */}
            <Modal
                title="Add New Alarm"
                open={showModal}
                onClose={() => setShowModal(false)}
                actions={
                    <div class="w-full flex justify-between items-center gap-4">
                        <Button
                            label="Cancel"
                            onClick={() => setShowModal(false)}
                            className="bg-gray-200 text-gray-800"
                        />
                        <Button
                            label="Create Alarm"
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
                            Alarm Name
                        </label>
                        <input
                            ref={alarmNameRef}
                            id="alarm-name"
                            type="text"
                            placeholder="Enter alarm name"
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alarm-hour">
                                Hour (0-23)
                            </label>
                            <input
                                ref={alarmHourRef}
                                id="alarm-hour"
                                type="number"
                                placeholder="Hour"
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alarm-minute">
                                Minute (0-59)
                            </label>
                            <input
                                ref={alarmMinuteRef}
                                id="alarm-minute"
                                type="number"
                                min="0"
                                max="59"
                                placeholder="Minute"
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <hr />
                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alarm-type">
                                Choose Channel
                            </label>
                            <select
                                ref={alarmChannelRef}
                                id="alarm-type"
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            >
                                <option value="1">Channel 1</option>
                                <option value="2">Channel 2</option>
                                <option value="3">Channel 3</option>
                            </select>
                        </div>
                        {/*Select with options ON/OFF*/}
                        <div className="w-1/2">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="alarm-type">
                                Choose Action
                            </label>
                            <select
                                ref={alarmActionRef}
                                id="alarm-type"
                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            >
                                <option value="on">ON</option>
                                <option value="off">OFF</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    )
}
