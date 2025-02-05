import { FontAwesomeIcon } from "../../components/FontAwesomeIcon";
import Card from "../../components/Card";

export default function About() {
    return (<div class="flex flex-col gap-6 w-full">
        <div class="flex gap-4">
            <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white">Primary</span>
            </div>
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-white">Secondary</span>
            </div>
        </div>
        
        <div class="fixed inset-0 bg-black bg-opacity-70 z-50">
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg">
                <div class="flex items-center justify-between">
                    <FontAwesomeIcon icon="robot" className="text-secondary animate-spin text-6xl" />
                </div>
            </div>
        </div>


        <Card title="WiFi" icon="wifi" className="w-full">
            <ul className="p-2">
                <li>
                    <div class="flex justify-between items-center my-2">
                        <div>
                            Conexion 1
                        </div>
                        <div>
                            <button class="bg-blue-500 text-white rounded-lg p-1">Conectar</button>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="flex justify-between items-center  my-2">
                        <div>
                            PPPC 2
                        </div>
                        <div>
                            <button class="bg-blue-500 text-white rounded-lg p-1">Conectar</button>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="flex justify-between items-center  my-2">
                        <div>
                            PPPC 3
                        </div>
                        <div>
                            <button class="bg-blue-500 text-white rounded-lg p-1">Conectar</button>
                        </div>
                    </div>
                </li>
            </ul>
        </Card>

        <div>
            <label for="small-input" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Small input</label>
            <input type="text" id="small-input" class="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
        </div>

        <div>
            <label for="email-address-icon" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your Email</label>
            <div class="relative">
                <div class="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                    <FontAwesomeIcon icon="envelope" className="text-gray-400 dark:text-gray-500" />
                </div>
                <input type="text" id="email-address-icon" class="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@flowbite.com" />
            </div>
        </div>


        <div>
            <label for="countries" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select your country</label>
            <select id="countries" class="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">

                <option>United States</option>
                <option>Canada</option>
                <option>France</option>
                <option>Germany</option>
            </select>
        </div>

        <label class="inline-flex items-center mb-5 cursor-pointer">
            <input type="checkbox" value="" class="sr-only peer" />
            <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:w-5 after:h-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Toggle me</span>
        </label>



        <div>
            <button type="button" class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800">Default</button>
            <button type="button" class="text-gray-900 hover:text-white border border-gray-800 hover:bg-gray-900 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-800">Dark</button>
            <button type="button" class="text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800">Green</button>
            <button type="button" class="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900">Red</button>
            <button type="button" class="text-yellow-400 hover:text-white border border-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:outline-none focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-yellow-300 dark:text-yellow-300 dark:hover:text-white dark:hover:bg-yellow-400 dark:focus:ring-yellow-900">Yellow</button>
            <button type="button" class="text-purple-700 hover:text-white border border-purple-700 hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-purple-400 dark:text-purple-400 dark:hover:text-white dark:hover:bg-purple-500 dark:focus:ring-purple-900">Purple</button>
        </div>

        <div>
            <button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Default</button>
            <button type="button" class="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Alternative</button>
            <button type="button" class="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Dark</button>
            <button type="button" class="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700">Light</button>
            <button type="button" class="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Green</button>
            <button type="button" class="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Red</button>
            <button type="button" class="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:focus:ring-yellow-900">Yellow</button>
            <button type="button" class="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900">Purple</button>
        </div>
        <div>


            <fieldset>
                <legend class="sr-only">Checkbox variants</legend>

                <div class="flex items-center mb-4">
                    <input checked id="checkbox-1" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    <label for="checkbox-1" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Opción 1 <a href="#" class="text-blue-600 hover:underline dark:text-blue-500">con un link</a>.</label>
                </div>

                <div class="flex items-center mb-4">
                    <input id="checkbox-2" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    <label for="checkbox-2" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Opción 2</label>
                </div>

                <div class="flex items-center mb-4">
                    <input id="checkbox-3" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    <label for="checkbox-3" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">Opción 3</label>
                </div>

                <div class="flex mb-4">
                    <div class="flex items-center h-5">
                        <input id="helper-checkbox" aria-describedby="helper-checkbox-text" type="checkbox" value="" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div class="ms-2 text-sm">
                        <label for="helper-checkbox" class="font-medium text-gray-900 dark:text-gray-300">Opción 4</label>
                        <p id="helper-checkbox-text" class="text-xs font-normal text-gray-500 dark:text-gray-400">Ayudita para esta opcion...</p>
                    </div>
                </div>

                <div class="flex items-center">
                    <input id="international-shipping-disabled" type="checkbox" value="" class="w-4 h-4 border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800" disabled />
                    <label for="international-shipping-disabled" class="ms-2 text-sm font-medium text-gray-400 dark:text-gray-500">Opción 4 (deshabilitado)</label>
                </div>
            </fieldset>

        </div>

        <div>
            <legend class="sr-only">Countries</legend>

            <div class="flex items-center mb-4">
                <input id="country-option-1" type="radio" name="countries" value="1" class="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600" checked />
                <label for="country-option-1" class="block ms-2  text-sm font-medium text-gray-900 dark:text-gray-300">
                    United States
                </label>
            </div>

            <div class="flex items-center mb-4">
                <input id="country-option-2" type="radio" name="countries" value="2" class="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:focus:bg-blue-600 dark:bg-gray-700 dark:border-gray-600" />
                <label for="country-option-2" class="block ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    Germany
                </label>
            </div>

            <div class="flex items-center mb-4">
                <input id="country-option-3" type="radio" name="countries" value="3" class="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600" />
                <label for="country-option-3" class="block ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    Spain
                </label>
            </div>

            <div class="flex items-center mb-4">
                <input id="country-option-4" type="radio" name="countries" value="4" class="w-4 h-4 border-gray-300 focus:ring-2 focus:ring-blue-300 dark:focus-ring-blue-600 dark:bg-gray-700 dark:border-gray-600" />
                <label for="country-option-4" class="block ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                    United Kingdom
                </label>
            </div>

            <div class="flex items-center">
                <input id="option-disabled" type="radio" name="countries" value="5" class="w-4 h-4 border-gray-200 focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 dark:bg-gray-700 dark:border-gray-600" disabled />
                <label for="option-disabled" class="block ms-2 text-sm font-medium text-gray-300 dark:text-gray-700">
                    China (disabled)
                </label>
            </div>


        </div>

    </div>)
}
