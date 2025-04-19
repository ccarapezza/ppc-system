import { ReactElement } from "preact/compat"
import { FontAwesomeIcon } from "./FontAwesomeIcon"
import { IconName } from "@fortawesome/fontawesome-svg-core"

interface CardProps {
    title: string | ReactElement
    icon?: IconName
    className: string
    children: any,
    rightContent?: ReactElement
}

const Card = ({ title, icon, className, children, rightContent }: CardProps) => {
    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 ${className}`}>
            <div className="w-full border-b py-2 px-4 dark:text-white dark:border-gray-700 flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                    {icon&&<FontAwesomeIcon icon={icon} className="mr-2" />} <span className="font-bold">{title}</span>
                </div>
                <div >
                    {rightContent}
                </div>
            </div>
            <div className="w-full dark:text-white">
                {children}
            </div>
        </div>
    )
}

export default Card