import { IconName } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from './FontAwesomeIcon';

interface IconButtonProps {
    icon: IconName;
    outlined?: boolean;
    indicator?: number;
    className?: string;
    onClick?: () => void;
}

function IconButton({ icon, outlined = false, indicator, className, ...props }: IconButtonProps) {
    const outlinedClass = `text-primary-700 hover:text-white border border-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:border-primary-500 dark:text-primary-500 dark:hover:text-white dark:hover:bg-primary-500 dark:focus:ring-primary-800`
    const containedClass = `text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800`

    return (
        <button type="button" className={`relative ${outlined ? outlinedClass : containedClass} ${className}`} {...props}>
            {icon&&<FontAwesomeIcon icon={icon} />}
            {indicator&&
                <div class={`absolute inline-flex items-center justify-center px-1 w-auto min-w-5 h-auto text-xs font-bold text-white bg-red-500 rounded-full -top-2 -end-2 dark:border-gray-900`}>
                    {indicator}
                </div>
            }
        </button>
    )
}

export default IconButton