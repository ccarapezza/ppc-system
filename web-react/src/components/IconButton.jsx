import React from 'react'
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function IconButton({ icon, color = 'grey', rounded = false, outlined = false, indicator, indicatorColor = 'red', className, ...props }) {
    const outlinedClass = `text-${color}-700 hover:text-white border border-${color}-700 hover:bg-${color}-800 focus:ring-4 focus:outline-none focus:ring-${color}-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-${color}-500 dark:text-${color}-500 dark:hover:text-white dark:hover:bg-${color}-500 dark:focus:ring-${color}-800`
    const containedClass = `text-white bg-${color}-700 hover:bg-${color}-800 focus:ring-4 focus:ring-${color}-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-${color}-600 dark:hover:bg-${color}-700 focus:outline-none dark:focus:ring-${color}-800`

    return (
        <button type="button" className={`relative ${outlined ? outlinedClass : containedClass} ${className}`} {...props}>
             {/*
            <FontAwesomeIcon icon={icon} />
            */}
            {indicator&&
                <div class={`absolute inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-${indicatorColor}-500 border border-white rounded-full -top-2 -end-2 dark:border-gray-900`}>
                    {indicator}
                </div>
            }
        </button>
    )







}

export default IconButton