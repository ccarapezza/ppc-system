import { ReactElement } from "preact/compat"
import Button from "./Button"

interface ModalProps {
    title: string | ReactElement
    children: any
    actions?: any
    open: boolean
    onClose?: any
    onTop?: boolean
}

export default function Modal({ title, children, actions, open, onClose, onTop }: ModalProps) {

    const onCloseHandler = () => {
        onClose && onClose()
    }

    if(!open){
        return (<></>)
    }
    return (
        <div className={`flex items-center justify-center min-h-screen bg-black absolute inset-0 bg-opacity-50 z-${onTop?"[999]":"50"}`}>
            <div id="default-modal" tabindex={-1} aria-hidden="true" className="fixed inset-0 z-50 overflow-auto flex items-center justify-center">
                <div class="relative p-4 w-full max-w-2xl max-h-full">
                    {/* Modal content */}
                    <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                        {/* Modal header */}
                        <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                            <button onClick={onCloseHandler} type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="default-modal">
                                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                                </svg>
                                <span class="sr-only">Close modal</span>
                            </button>
                        </div>
                        {/* Modal body */}
                        <div class="p-4 md:p-5 space-y-4">
                            {children}
                        </div>
                        {/* Modal footer */}
                        <div class="flex justify-end items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                            {actions?
                                actions
                                :
                                <>
                                    <button data-modal-hide="default-modal" type="button" class="bg-primary text-white hover:brightness-90 focus:ring-4 focus:outline-none focus:ring-primary font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:brightness-90 dark:hover:brightness-95 dark:focus:ring-primary">Ok</button>
                                    <Button label="Ok" className="bg-gray-200 text-gray-800" onClick={onCloseHandler} />
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
