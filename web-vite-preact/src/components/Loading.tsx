import { FontAwesomeIcon } from "./FontAwesomeIcon";

const Loading = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black absolute inset-0 z-50 opacity-50">
            <FontAwesomeIcon icon="circle-notch" className="animate-spin text-blue-500 text-5xl" />
        </div>
    );
};

export default Loading;