import { ReactElement } from "preact/compat"
import { FontAwesomeIcon } from "./FontAwesomeIcon"
import { IconName } from "@fortawesome/fontawesome-svg-core"

interface CardProps {
    title: string | ReactElement
    icon?: IconName
    className: string
    children: any
}

const Card = ({ title, icon, className, children }: CardProps) => {
    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 ${className}`}>
            <div className="w-full border-b py-2 px-4 dark:text-white dark:border-gray-700 flex items-center gap-2">
                {icon&&<FontAwesomeIcon icon={icon} className="mr-2" />} <span className="font-bold">{title}</span>
            </div>
            <div className="w-full dark:text-white">
                {children}
            </div>
        </div>
    )
}

export default Card