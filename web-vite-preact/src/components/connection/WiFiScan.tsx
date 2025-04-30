import { useEffect, useState } from 'preact/hooks';
import Card from '../Card'
import { PpcApi } from './../../api/PpcApi';
import { ConnectionStatus, EncryptionType, EncryptionTypeLabel, Utils } from "./../../constants";
import { FontAwesomeIcon } from '../FontAwesomeIcon';
import Loading from '../Loading';
import WiFiConnectModal from './WiFiConnectModal';
import Modal from '../Modal';
import Button from '../Button';

export type ModalMessage = {
    title: string
    message: string
}

type ConnectionStatusProps = {
    connectionStatus: ConnectionStatus | null
    setConnectionStatus: (connectionStatus: ConnectionStatus | null) => void
}

export default function WiFiScan({ connectionStatus, setConnectionStatus }: ConnectionStatusProps) {

    const [wifiList, setWifiList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingConnectWifi, setLoadingConnectWifi] = useState(false);
    const [messageModal, setMessageModal] = useState<{ title: string, message: string }|null>(null);
    const [selectedWifi, setSelectedWifi] = useState<any>(null);

    const scanWifi = () => {
        setLoading(true);
        PpcApi.getWifiScan().then((response: any) => {
            setWifiList(response?.data.sort((a: any, b: any) => b.RSSI - a.RSSI));
        }).catch((error: any) => {
            console.error(error);
        }).finally(() => {
            setLoading(false);
        })
    }

    //useEffect: scan wifi if wifilist is empty and retry every 5 seconds
    const RETRY_INTERVAL = 5000;
    useEffect(() => {
        if (wifiList.length == 0) {
            scanWifi();
        }
        const interval = setInterval(() => {
            if (wifiList.length == 0) {
                scanWifi();
            }
        }, RETRY_INTERVAL);
        return () => clearInterval(interval);
    }, [wifiList])
    
    const onCloseMessageModal = () => {
        setMessageModal(null);
    }

    const onCloseWifiConnectModal = (message: ModalMessage | null) => {
        if (message) {
            setMessageModal(message);
        }
        setSelectedWifi(null);
    }

    return (<>
        {(loading || loadingConnectWifi) && <Loading />}
        <Modal
            title={messageModal?.title || "Message"}
            open={messageModal != null}
            onClose={onCloseMessageModal}
            actions={<div class="w-full flex justify-between items-center gap-4">
                <Button
                    label="OK"
                    onClick={onCloseMessageModal}
                    className="bg-primary text-white"
                />
            </div>}
            onTop
        >
            <div>{messageModal?.message}</div>
        </Modal>
        <WiFiConnectModal
            networkConnectionData={selectedWifi}
            closeModal={onCloseWifiConnectModal}
            connectionStatus={connectionStatus}
            setConnectionStatus={setConnectionStatus}
            setLoading={setLoadingConnectWifi}
        />
        <p class="text-gray-800 font-bold text-lg">WiFi Networks</p>

        {wifiList.length > 0 &&
            <Card title={<span className={"font-bold"}>WiFi</span>} icon="wifi" className="w-full">
                <ul class="m-0 p-0">
                    {wifiList?.map((wifi: any) => {
                        return (
                            <li className="cursor-pointer border-gray-200 py-1 hover:bg-gray-100" key={wifi.BSSID} onClick={() => setSelectedWifi(wifi)}>
                                <div class="flex justify-between items-center my-2 px-4">
                                    <div>
                                        <div class="font-bold">{wifi.ssid}</div>
                                        <div class="text-gray-500 text-xs flex">
                                            {EncryptionType.OPEN == wifi.encryptionType ? <FontAwesomeIcon icon="lock-open" className="text-gray-300 mr-2" /> : <FontAwesomeIcon icon="lock" className="text-gray-800 mr-2" />}
                                            {EncryptionTypeLabel[wifi.encryptionType]}
                                        </div>
                                    </div>
                                    <div>
                                        <div class="w-10 h-10 relative">
                                            <div className="w-[100%] overflow-hidden absolute">
                                                <FontAwesomeIcon icon="signal" className="h-10 w-10 text-gray-300" />
                                            </div>
                                            <div style={{ width: `${Utils.getSignalLevel(wifi.RSSI)}%` }} className={`overflow-hidden absolute`}>
                                                <FontAwesomeIcon icon="signal" className="h-10 w-10 text-secondary" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </Card>
        }
    </>)
}
