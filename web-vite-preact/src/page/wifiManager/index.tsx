import { useEffect, useState } from "preact/hooks";
import { ConnectionState, ConnectionStatus } from "../../constants";
import { PpcApi } from "../../api/PpcApi";
import { FontAwesomeIcon } from "../../components/FontAwesomeIcon";
import Button from "../../components/Button";
import WiFiStatus from "../../components/connection/WiFiStatus";
import WiFiScan from "../../components/connection/WiFiScan";

export default function WifiManager() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus|null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const RETRY_INTERVAL = 5000;
  useEffect(() => {
    if(connectionStatus?.status==ConnectionState.CONNECTING || connectionStatus == null){

      (function loop() {
        setTimeout(() => {
          setIsLoading(true);
          setError(null);
          PpcApi.getWifiStatus().then((response: any) => {
            console.log("WiFi Status", response);
            if(response.status == ConnectionState.CONNECTED){
              setShowAssistant(true);
            }
            setConnectionStatus(response);
          }).catch((error: any) => {
            console.error(error);
            setError("Error al obtener el estado de la conexión WiFi.\n Intentando de nuevo en 5 segundos...");
            setConnectionStatus(null);
            loop();
          }).finally(() => {
            setIsLoading(false);
          });
        }, RETRY_INTERVAL);
      })();
    }
  }, [connectionStatus])

  const handleConnectionStatusChange = (status: ConnectionStatus | null) => {
    if (status == null) return;
    setConnectionStatus(status);
    if (status.status === ConnectionState.CONNECTED) {
      setShowAssistant(true);
    }
  }

  const [showAssistant, setShowAssistant] = useState(true);

  return (
    <div className="w-full flex flex-col gap-4">
      {showAssistant &&
        <div className={`flex items-center justify-center min-h-screen bg-black absolute inset-0 bg-opacity-50 z-50`}>
          <div id="default-modal" tabindex={-1} aria-hidden="true" className="fixed inset-0 z-50 overflow-auto flex items-center justify-center">
            <div class={`flex items-center justify-between gap-4`}>
                <div class="flex flex-col justify-center items-center gap-4 relative">
                  {isLoading&&
                    <FontAwesomeIcon icon="spinner" className={`text-primary my-2 text-2xl absolute z-[999] top-0 ml-28 ${isLoading&&"animate-spin"}`} />
                  }
                  {error && !isLoading &&
                    <FontAwesomeIcon icon="exclamation-triangle" className={`text-red-500 my-2 text-2xl absolute z-[999] top-0 ml-28 ${error&&"animate-pulse-3"}`} />
                  }
                  {connectionStatus?.status == ConnectionState.CONNECTED &&
                    <FontAwesomeIcon icon="check-circle" className="text-secondary my-2 text-2xl absolute z-[999] top-0 ml-28" />
                  }
                  <div class={`relative`}>
                      {error && !isLoading &&
                        <div class={`absolute rounded-md inset-0 w-full h-full bg-red-500 opacity-30`}></div>
                      }
                      <img src="/robot-avatar.png" alt="Power Plant Control" class={`w-40 rounded-xl ${isLoading&&"animate-loading-pulse transition-all duration-300"} ${error&&"shadow-[0_0_15px_1px_rgba(0,0,0,0.25)] shadow-md shadow-red-500"}`} />
                  </div>
                  <div class="max-w-[42rem] text-center dark:bg-gray-900 bg-gray-100 rounded-lg shadow-lg p-4 mx-4">
                    {error && !isLoading &&
                      <div class="inset-0 w-full h-full flex flex-col gap-4 items-center justify-center font-bold">
                        {error}
                      </div>
                    }
                    {isLoading &&
                      <span className={"font-bold text-center"}>
                        Estoy verificando la conexión a la red <FontAwesomeIcon icon="wifi" className="inline-flex items-baseline" /> WiFi.<br/> Por favor, espera un momento.
                      </span>
                    }
                    {connectionStatus?.status == ConnectionState.DISCONNECTED &&
                      <div class="font-bold text-center flex flex-col gap-4 overflow-hidden relative">
                        <div class="font-bold text-center text-sm flex flex-col justify-center items-center gap-1">
                          <div>
                            <FontAwesomeIcon icon="globe" className="text-blue-400 inline-flex items-baseline w-5 h-5 mx-2" />
                            Si quieres operar el dispositivo a través de Internet, conecta tu dispositivo a una red WiFi.
                          </div>
                          <Button
                            label="Conectar a una red WiFi"
                            icon="arrow-right"
                            className="bg-primary text-white w-fit m-auto"
                            onClick={() => {
                              setShowAssistant(false);
                            }}
                          />
                        </div>
                        <Button
                          label="Cerrar"
                          icon="xmark"
                          className="bg-gray-200 text-gray-800 w-fit m-auto mt-4"
                          onClick={() => {
                            setShowAssistant(false);
                          }}
                        />
                      </div>
                    }
                    {connectionStatus?.status == ConnectionState.CONNECTED &&
                        <div class="flex flex-col gap-4 items-center">
                          <div class="font-bold text-center">
                            ¡Conectado a la red WiFi!
                          </div>
                          <Button
                            label="Cerrar"
                            icon="xmark"
                            className="bg-gray-200 text-gray-800 w-fit"
                            onClick={() => {
                              setShowAssistant(false);
                            }}
                          />
                      </div>
                    }
                  </div>
                </div>
            </div>
          </div>
        </div>
      }

      <WiFiStatus connectionStatus={connectionStatus} setConnectionStatus={setConnectionStatus} />
      {(connectionStatus?.status === ConnectionState.DISCONNECTED ||connectionStatus?.status === ConnectionState.CONNECTING) &&
        <WiFiScan connectionStatus={connectionStatus} setConnectionStatus={handleConnectionStatusChange}/>
      }
    </div>
  )
}
