import { IconName } from "@fortawesome/fontawesome-svg-core"
import { FontAwesomeIcon } from "./FontAwesomeIcon"

interface ButtonProps {
    label?: string,
    className?: string
    onClick?: any
    icon?: IconName
}

export default function Button({ label, onClick, icon, className = "bg-gray-200 text-gray-900" }: ButtonProps) {
    
    return (
        <button
            data-modal-hide="default-modal"
            type="button"
            onClick={onClick}
            class={`${className} hover:brightness-90 focus:ring-4 focus:outline-none focus:ring-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:brightness-90 dark:hover:brightness-95 dark:focus:ring-primary`}
        >
            <div className={"flex items-center gap-2"}>
                {icon&&
                    <FontAwesomeIcon icon={icon} />
                }
                {label&&label}
            </div>
        </button>
    )
}
