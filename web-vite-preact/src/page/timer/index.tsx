import { useEffect, useRef, useState } from "preact/hooks";
import { PpcApi } from "../../api/PpcApi";
import { FontAwesomeIcon } from "../../components/FontAwesomeIcon"
import DigitalPin from "../../components/DigitalPin";

export default function Timer() {

    const [loading, setLoading] = useState(false);
    const clockRef = useRef<HTMLSpanElement>(null);
    const clockSecRef = useRef<HTMLSpanElement>(null);
    const [time, setTime] = useState<number>(new Date().getTime());
    const [retro, setRetro] = useState<'default'|'red'|'green'|'blue'>('blue');
    const [inverse, setInverse] = useState(false);

    const [mode, setMode] = useState<'auto'|'manual'>('auto');

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
        clockRef.current!.innerText = clock;
        clockSecRef.current!.innerText = clockSec;
        setTimeout(() => {
            clockRef.current!.innerText = clockRef.current!.innerText.replace(":", " ");
        }, 500);
    }

    useEffect(() => {
        renderClock();
    }, [time]);

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
                                                <div class="w-full text-center D7MBI clock-time"><span id="clock" class="text-8xl w-full" ref={clockRef}>!! !!</span><span id="clock-sec" class="ml-1 text-2xl hidden" ref={clockSecRef}>!!</span></div>
                                                <div class="w-full text-center D7MBI clock-time-background"><span class="text-8xl">88:88</span><span class="ml-1 text-2xl hidden">88</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex gap-2 justify-between items-center p-2 mb-2 w-full xl:max-w-xl text-xl text-gray-800 dark:text-white mt-12">
                                    <div>
                                        Next Event
                                    </div> 
                                    <div class="flex items-center gap-2">
                                        <div class="w-full text-center text-sm">
                                            13:45
                                        </div>
                                        <div id="currentState-off" class="flex align-center px-2 justify-center items-center">
                                            <div class="bg-red-500 w-3 h-3 rounded-full d-flex">&nbsp;</div> <span
                                                class="text-red-500 font-bold pl-2 text-sm">OFF</span>
                                        </div>
                                        <div id="currentState-on" class="flex hidden align-center px-2 justify-center items-center">
                                            <div class="bg-green-500 w-3 h-3 rounded-full">&nbsp;</div> <span
                                                class="text-green-500 font-bold pl-2 text-sm">ON</span>
                                        </div>
                                    </div>
                                </div>

                                

                                <button id="addEvent" type="button"
                                    //onclick="clickAddButton();"
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
        </>
    )
}
