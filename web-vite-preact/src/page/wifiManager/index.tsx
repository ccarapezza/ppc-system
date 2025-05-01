import { useEffect, useState } from "preact/hooks";
import { ConnectionState, ConnectionStatus } from "../../constants";
import { PpcApi } from "../../api/PpcApi";
import Modal from "../../components/Modal";
import { FontAwesomeIcon } from "../../components/FontAwesomeIcon";
import Button from "../../components/Button";
import WiFiStatus from "../../components/connection/WiFiStatus";
import WiFiScan from "../../components/connection/WiFiScan";

export default function WifiManager() {
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus|null>(null);

  const RETRY_INTERVAL = 5000;
  useEffect(() => {
    setLoading(true);
    if(connectionStatus?.status==ConnectionState.CONNECTING || connectionStatus == null){
      const interval = setInterval(() => {
        PpcApi.getWifiStatus().then((response: any) => {
          console.log("WiFi Status", response);
          if(response.status!=ConnectionState.CONNECTING){
            clearInterval(interval);
          }
          setConnectionStatus(response);
        }).catch((error: any) => {
          console.error(error);
        }).finally(() => {
          setLoading(false);
        });
      }, RETRY_INTERVAL);
      
    }
  }, [connectionStatus])
  
  const [showModal, setShowModal] = useState(true);

  return (
    <div className="w-full flex flex-col gap-4">
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span>Power Plant Control</span>
            <FontAwesomeIcon icon="robot" className="text-secondary text-2xl animate-pulse-3" />
          </div>
        }
        open={showModal}
        onClose={() => setShowModal(false)}
        actions={<div class="w-full flex justify-between items-center gap-4">
          <Button
            label="Cancelar"
            onClick={() => {
              setShowModal(false);
            }}
            className="bg-gray-200 text-gray-800"
          />
          <Button
            label="Continuar"
            className="bg-primary text-white"
            onClick={() => {
              setShowModal(false);
            }}
          />
        </div>}
      >
        <div>
          <div class="flex items-center justify-between gap-4 animate-talking">
            <img src="/ppc-bot.jpg" alt="Power Plant Control" class="w-20 h-20 rounded-full" />
            <div class="text-gray-500">Gracias por elegir nuestro  <span className={"font-bold"}>Timer Digital T-1000</span>, diseñado para brindarte precisión, eficiencia y control en tus cultivos. Para comenzar, conecta tu dispositivo a una red <span className={"font-bold"}>WiFi</span>.</div>
          </div>
        </div>
      </Modal>
      <WiFiStatus connectionStatus={connectionStatus} setConnectionStatus={setConnectionStatus} />
      {connectionStatus?.status !== ConnectionState.CONNECTED && !loading &&
        <WiFiScan connectionStatus={connectionStatus} setConnectionStatus={setConnectionStatus}/>
      }
    </div>
  )
}
