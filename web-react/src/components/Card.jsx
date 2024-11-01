//import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

const Card = ({ title, icon, children }) => {
    return (
        <div className="max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div className="w-full border-b py-2 px-4 dark:text-white dark:border-gray-700">
                 {/*
                <FontAwesomeIcon icon={icon} /> <span className="font-bold text-md">{title}</span>
                 */}
            </div>
            <div className="w-full py-2 px-4 dark:text-white">
                {children}
            </div>
        </div>
    )
}

export default Card