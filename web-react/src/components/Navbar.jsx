//import { faBars, faBell } from '@fortawesome/free-solid-svg-icons';
//import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import ThemeSwitchButtons from './ThemeSwitchButtons.jsx';
import IconButton from './IconButton.jsx';
//import './Navbar.css'; // Import CSS file for styling

const MENU = [
    { name: 'Dashboard', link: '#' },
    { name: 'Team', link: '#' },
    { name: 'Projects', link: '#' },
    { name: 'Calendar', link: '#' },
];

const Navbar = () => {
    return (
        <nav className="gradient-background" >
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">

                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden mx-2">
                        <label className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" for="side-menu">
                             {/*
                            <FontAwesomeIcon icon={faBars} />
                            */}
                            <input className="peer hidden" type="checkbox" id="side-menu" />
                            <div className="fixed inset-0 z-40 hidden h-full w-full bg-black/50 backdrop-blur-sm peer-checked:block">
                                &nbsp;
                            </div>
                            <div className="fixed top-0 left-0 z-40 h-full w-full -translate-x-full overflow-y-auto overscroll-y-none transition duration-500 peer-checked:translate-x-0">
                                <div className="float-left min-h-full w-[85%] bg-white px-6 pt-12 shadow-2xl">
                                    <menu className="space-y-1 px-2 pb-3 pt-2">
                                        {MENU.map((item, index) => (
                                            <li>
                                                <a key={`${item.name}`} href={item.link} className="text-gray-800 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium">
                                                    {item.name}
                                                </a>
                                            </li>
                                        ))}
                                    </menu>
                                </div>
                            </div>
                        </label>
                    </div>



                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex flex-shrink-0 items-center text-white font-bold text-3xl">
                            PPC
                        </div>
                        <div className="hidden sm:ml-6 sm:block">
                            <div className="flex space-x-4">
                                {MENU.map((item, index) => (
                                    <a key={`${item.name}`} href={item.link} className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium">
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">                       

                        <ThemeSwitchButtons/>
                        <IconButton icon={{/*faBell*/}} color="gray" indicator={3}/>

                        <div className="relative ml-3">
                            <div>
                                <button type="button"
                                    className="user-menu-button flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                    aria-expanded="false" aria-haspopup="true">
                                    <span className="sr-only">Open user menu</span>
                                    <img className="h-8 w-8 rounded-full"
                                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                        alt="" />
                                </button>
                            </div>
                            <div id="menu-profile"
                                className="menu-profile transition ease-in duration-300 absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden"
                                role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1"
                                    id="user-menu-item-0">Your Profile</a>
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1"
                                    id="user-menu-item-1">Settings</a>
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1"
                                    id="user-menu-item-2">Sign out</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden sm:hidden" id="mobile-menu">
                <div className="space-y-1 px-2 pb-3 pt-2">
                    {MENU.map((item, index) => (
                        <a key={`${item.name}`} href={item.link} className="text-gray-300 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium">
                            {item.name}
                        </a>
                    ))}
                </div>
            </div>
        </nav >
    );
};

export default Navbar;