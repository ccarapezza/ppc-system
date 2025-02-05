import Button from "../Button";
import Modal from "../Modal";
import { ConnectionState, ConnectionStatus, EncryptionType, EncryptionTypeLabel, Utils } from "./../../constants";
import { FontAwesomeIcon } from '../FontAwesomeIcon';
import { useEffect, useRef, useState } from "preact/hooks";
import { PpcApi } from './../../api/PpcApi';
import Loading from "../Loading";

export default function WiFiConnectModal({
    networkConnectionData,
    closeModal
}: {
    networkConnectionData: {
        BSSID: string,
        RSSI: number,
        encryptionType: number,
        ssid: string
    } | null,
    closeModal: Function
}) {
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkConnectionStatus();
    }, [])

    const passwordInputShake = () => {
        if (passwordRef?.current) {
            const htmlInput: HTMLInputElement = passwordRef?.current;
            htmlInput.focus();
            htmlInput.classList.add("animate-shake");
            setTimeout(() => {
                htmlInput.classList.remove("animate-shake");
            }, 1000);
        }
    }

    const connectWifi = () => {
        setLoading(true);
        const password = passwordRef.current?.value;

        if (password?.length! < 8) {
            passwordInputShake();
            setLoading(false);
            return;
        }

        PpcApi.connectWifi(networkConnectionData?.ssid!, password!).then((response: any) => {
            console.log("Connect WiFi", response);
            setConnectionStatus(response);
        }).catch((error: any) => {
            console.error(error);
        }).finally(() => {
            setLoading(false);
        })
    }

    const checkConnectionStatus = () => {
        setLoading(true);
        PpcApi.getWifiStatus().then((response: any) => {
            console.log("WiFi Status", response);
            setConnectionStatus(response);
            //if connection is still connecting, retry every 5 seconds
            if (response.status == ConnectionState.CONNECTING) {
                setInterval(() => {
                    checkConnectionStatus();
                }, 5000);
            }
        }).catch((error: any) => {
            console.error(error);
        }).finally(() => {
            setLoading(false);
        })
    }

    return (<>
        {(loading || (connectionStatus?.status == ConnectionState.CONNECTING)) && <Loading />}
        <Modal
            title="WiFi Details"
            open={networkConnectionData != null}
            onClose={() => closeModal()}
            actions={<div class="w-full flex justify-between items-center gap-4">
                <Button
                    label="Cancel"
                    onClick={() => {
                        closeModal();
                    }}
                    className="bg-gray-200 text-gray-800"
                />
                <Button
                    label="Connect"
                    className="bg-primary text-white"
                    onClick={connectWifi}
                />
            </div>}
        >
            <div>
                <div class="flex items-center justify-between">
                    <div class="text-lg font-bold">{networkConnectionData?.ssid}</div>
                    <div class="text-gray-500 text-xs flex">
                        {EncryptionType.OPEN == networkConnectionData?.encryptionType ? <FontAwesomeIcon icon="lock-open" className="text-gray-300 mr-2" /> : <FontAwesomeIcon icon="lock" className="text-gray-800 mr-2" />}
                        {EncryptionTypeLabel[networkConnectionData?.encryptionType!]}
                    </div>
                </div>
                <div class="flex items-center justify-between mt-4">
                    <div class="text-gray-500 text-xs">Señal</div>
                    <div class="w-10 h-10 relative">
                        <div className="w-[100%] overflow-hidden absolute">
                            <FontAwesomeIcon icon="signal" className="h-10 w-10 text-gray-300" />
                        </div>
                        <div style={{ width: `${Utils.getSignalLevel(networkConnectionData?.RSSI!)}%` }} className={`overflow-hidden absolute`}>
                            <FontAwesomeIcon icon="signal" className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                </div>
                {networkConnectionData?.encryptionType != EncryptionType.OPEN &&
                    <div class="mt-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2" for="small-input">Password</label>
                        <input ref={passwordRef} type="password" id="small-input" class="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                    </div>
                }
            </div>
        </Modal>
    </>)
}
