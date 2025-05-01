import Button from "../Button";
import Card from "../Card";
import { ConnectionState } from "./../../constants";
import { FontAwesomeIcon } from "../FontAwesomeIcon";
import { useState } from "preact/hooks";
import { PpcApi } from "./../../api/PpcApi";

interface ConnectionStatus {
    status: string
    ssid: string
    "ap-info":{
      ssid: string
      ip: string
    }
  }

  type ConnectionStatusProps = {
    connectionStatus: ConnectionStatus | null
    setConnectionStatus: (connectionStatus: ConnectionStatus | null) => void
  }

export default function WiFiStatus({connectionStatus, setConnectionStatus}: ConnectionStatusProps) {

    const [loading, setLoading] = useState(false);
    //const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus|null>(null);

    const disconnectWifi = () => {
        setLoading(true);
        PpcApi.disconnectWifi().then((response: any) => {
          console.log("Disconnect WiFi", response);
          setConnectionStatus(response);
        }).catch((error: any) => {
          console.error(error);
        }).finally(() => {
          setLoading(false);
        })
    }
    
    return (
        <Card title="Estado de conexión" icon="wifi" className="w-full">
            <div class="p-4">
                <div class="flex items-center justify-between">
                    {(loading || connectionStatus == null) &&
                      <div class="text-gray-500 text-xs w-full">
                          <div class="flex items-center gap-2">
                            <FontAwesomeIcon icon="circle-notch" className="animate-spin text-gray-800" />
                            <span>Cargando...</span>
                          </div>
                      </div>
                    }
                    <div class="text-gray-500 text-xs w-full">
                        {ConnectionState.DISCONNECTED==connectionStatus?.status&&
                        <>
                            <span class="bg-red-100 text-red-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300 border border-red-300">Desconectado</span>
                        </>
                        }
                        {ConnectionState.CONNECTING==connectionStatus?.status&&
                        <div class="flex gap-2 items-center w-full">
                            <span class="bg-yellow-100 text-yellow-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300 border border-yellow-300">Conectando</span>
                            <FontAwesomeIcon icon="circle-notch" className="animate-spin text-yellow-800" />
                        </div>
                        }
                        {ConnectionState.CONNECTED==connectionStatus?.status&&
                        <div class="grid grid-rows-1 grid-flow-col gap-2 items-center">
                            <div className="flex items-center gap-2">
                            <span class="bg-green-100 text-green-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300 border border-green-300">Conectado</span>

                            <div class="text-gray-500 text-xs">
                                <span class="italic">Conectado a </span><span className="font-bold">{connectionStatus?.ssid}</span>
                            </div>
                            </div>

                            <Button
                                icon="plug-circle-xmark"
                                label="Desconectar"
                                onClick={disconnectWifi}
                                className="bg-red-200 text-red-800 justify-self-end text-md"
                            />

                        </div>
                        }
                    </div>
                </div>
            </div>
        </Card>
    )
}
