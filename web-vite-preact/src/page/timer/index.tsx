import { useEffect, useRef, useState } from "preact/hooks";
import { PpcApi } from "../../api/PpcApi";
import Card from "../../components/Card";
import { FontAwesomeIcon } from "../../components/FontAwesomeIcon"

export default function Timer() {

    const [loading, setLoading] = useState(false);
    const clockRef = useRef<HTMLSpanElement>(null);
    const clockSecRef = useRef<HTMLSpanElement>(null);
    const [time, setTime] = useState<number>(new Date().getTime());
    const [retro, setRetro] = useState<'default'|'red'|'green'|'blue'>('default');
    const [inverse, setInverse] = useState(false);

    const [mode, setMode] = useState<'auto'|'manual'>('auto');
    const [status, setStatus] = useState<boolean>(false);

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

    return (
        <Card title="Timer" icon="stopwatch" className="w-full">
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
                                <div className="flex justify-center gap-2 m-4">
                                    <button 
                                        type="button"
                                        onClick={() => setRetro('default')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${retro === 'default' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                        Default
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setRetro('green')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${retro === 'green' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}
                                    >
                                        Green
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setRetro('red')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${retro === 'red' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}
                                    >
                                        Red
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRetro('blue')}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${retro === 'blue' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
                                    >
                                        Blue
                                    </button>
                                </div>
                                <div class="flex justify-center m-2">
                                    <button 
                                        type="button"
                                        onClick={() => setInverse(!inverse)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-md ${inverse ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                    >
                                        Inverse
                                    </button>
                                </div>

                                <div class="flex flex-col gap-4 justify-center max-w-md rounded-md border border-gray-200 p-2 mb-2">
                                    <div className="flex justify-center gap-2 mb-2">
                                        <button 
                                            type="button"
                                            onClick={() => setMode('auto')}
                                            className={`px-3 py-1 text-sm font-semibold rounded-md ${mode === 'auto' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                        >
                                            Auto
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setMode('manual')}
                                            className={`px-3 py-1 text-sm font-semibold rounded-md ${mode === 'manual' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                                        >
                                            Manual
                                        </button>
                                    </div>
                                    <div className={`${retro}-lcd ${inverse ? 'inverse' : ''}`}>
                                        <div class="clock-background w-full">
                                            <div class="flex gap-2 p-2 justify-between items-center">
                                                <div class="D7MBI clock-time">{new Intl.DateTimeFormat(undefined, { day:'2-digit', month: '2-digit', year: '2-digit' }).format(new Date(time)).replace(/\//g, "-")}</div>
                                                <div class="D7MBI clock-time-background">{"88-88-88"}</div>
                                                <div class="flex gap-2">
                                                    <div class={`rounded-full px-2 py-1 text-sm font-bold shadow-sm text-clock ${mode !== 'auto' && 'disable-clock-background'}`}>AUTO</div>
                                                    <div class={`rounded-full px-2 py-1 text-sm font-bold shadow-sm text-clock ${mode !== 'manual' && 'disable-clock-background'}`}>MANUAL</div>
                                                </div>
                                            </div>

                                            <div class="flex align-center p-2 justify-center items-center clock-wrapper w-full">
                                                <div class="w-full text-center D7MBI clock-time"><span id="clock" class="text-6xl w-full" ref={clockRef}>!! !!</span><span id="clock-sec" class="ml-1 text-2xl" ref={clockSecRef}>!!</span></div>
                                                <div class="w-full text-center D7MBI clock-time-background"><span class="text-6xl">88:88</span><span class="ml-1 text-2xl">88</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <button id="switch-mode" type="button"
                                        onClick={() => setStatus(!status)}
                                        class={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${status ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                                    >
                                        {status ? "OFF" : "ON"}
                                    </button>
                                </div>
                                <div class="flex justify-center rounded-md border border-gray-200 p-2 mb-2">
                                    <div class="border rounded-md border-gray-700 ml-2">
                                        <div
                                            class="border-b bg-gray-200 rounded-t-md px-2 font-bold text-center text-sm whitespace-nowrap">
                                            Current State
                                        </div>
                                        <div id="currentState-off" class="flex hidden align-center p-2 justify-center items-center">
                                            <div class="bg-red-500 w-5 h-5 rounded-full d-flex">&nbsp;</div> <span
                                                class="text-red-500 font-bold pl-2">OFF</span>
                                        </div>
                                        <div id="currentState-on" class="flex hidden align-center p-2 justify-center items-center">
                                            <div class="bg-green-500 w-5 h-5 rounded-full">&nbsp;</div> <span
                                                class="text-green-500 font-bold pl-2">ON</span>
                                        </div>
                                    </div>
                                    <div class="border rounded-md border-gray-700 ml-2">
                                        <div
                                            class="border-b bg-gray-200 rounded-t-md px-2 font-bold text-center text-sm whitespace-nowrap">
                                            Next Event
                                        </div>
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
                                    class="mt-2 mb-4 inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                                    <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
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
        </Card>
    )
}
