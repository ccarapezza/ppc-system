import { useState, useEffect } from 'preact/hooks';
import { PpcApi } from '../api/PpcApi';

interface DigitalPinProps {
    id: number;
    name?: string;
    disabled?: boolean;
    hideControl?: boolean;
    hideState?: boolean;
}

type DigitalPinResponse = {
    id: number;
    pin: number;
    state: boolean;
    success: boolean;
};

const DigitalPin = ({id, name = `Pin id: ${id}`, disabled, hideControl, hideState}: DigitalPinProps) => {
    const [state, setState] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch current state on component mount
    useEffect(() => {
        PpcApi.getDigitalOutput(id).then((response: DigitalPinResponse) => {
            if (response.success) {
                setState(response.state);
            } else {
                setError(`Failed to fetch pin state: ${response.success}`);
            }
        }).catch((err: any) => {
            setError(`Failed to fetch pin state: ${err instanceof Error ? err.message : String(err)}`);
        }).finally(() => {
            setLoading(false);
        });
        // Cleanup function to reset state on unmount
    }, [id]);

    // Function to toggle pin state via API
    const togglePinState = async () => {
        try {
            setLoading(true);
            setError(null);
            const response: DigitalPinResponse = await PpcApi.setDigitalOutput(id, !state)
            if (!response.success) {
                throw new Error(`Error: ${response.success}`);
            }
            setState(response.state);
        } catch (err) {
            setError(`Failed to update pin state: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    return (<>
        <div class="flex items-center justify-between w-full h-full max-w-xl">
            <div class="flex items-center gap-2 w-full h-full">
                <div className="text-xl text-gray-800 dark:text-white">
                    {name} {error && <span class="text-red-500 text-sm">{error}</span>}
                </div>
                {!hideState &&
                    <div id="currentState-off" class="flex align-center p-2 justify-center items-center">
                        <div class={`${state?"bg-green-500":"bg-red-500"} w-3 h-3 rounded-full d-flex`}>&nbsp;</div>
                        <span class={`${state?"text-green-500":"text-red-500"} font-bold pl-2 text-sm`}>{state?"ON":"OFF"}</span>
                    </div>
                }
                {!hideControl&&
                    <label class="inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={state} onChange={togglePinState} disabled={disabled === true || loading} class="sr-only peer" />
                        <div class={disabled?`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:w-5 after:h-5 after:transition-all dark:border-gray-600`
                        :
                        `relative w-11 h-6 bg-red-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-red-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-red-300 after:border after:rounded-full after:w-5 after:h-5 after:transition-all dark:border-red-600 peer-checked:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:opacity-50`}></div>
                    </label>
                }
            </div>
        </div>
    </>
    )
};

export default DigitalPin;