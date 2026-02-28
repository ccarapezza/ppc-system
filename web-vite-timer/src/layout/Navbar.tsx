import { FontAwesomeIcon } from "../components/FontAwesomeIcon";
import IconButton from "../components/IconButton";
import ThemeSwitchButtons from "../components/ThemeSwitchButtons";
import { useRef, useEffect } from 'preact/hooks';

const MENU = [
    { name: 'Wifi', link: '/wifi' },
    { name: 'About', link: '/about' },
    { name: 'Timer', link: '/timer' }
];

const Navbar = () => {
    //const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement | null>(null);
    const profileButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node) && profileButtonRef.current && !profileButtonRef.current.contains(event.target as Node)) {
                //setIsProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    /*
    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };
    */

    return (
        <nav className="gradient-background" >
            <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">

                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden mx-2">
                        <label className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" for="side-menu">
                            <FontAwesomeIcon icon='bars' />
                            <input className="peer hidden" type="checkbox" id="side-menu" />
                            <div className="fixed inset-0 z-40 hidden h-full w-full bg-black/50 backdrop-blur-sm peer-checked:block">
                                &nbsp;
                            </div>
                            <div className="fixed top-0 left-0 z-40 h-full w-full -translate-x-full overflow-y-auto overscroll-y-none transition duration-500 peer-checked:translate-x-0">
                                <div className="float-left min-h-full w-[70%] bg-white px-6 pt-12 shadow-2xl">
                                    <menu className="space-y-1 px-2 pb-3 pt-2">
                                        {MENU.map((item) => (
                                            <li>
                                                <a key={`${item.name}`} href={item.link} onClick={
                                                    () => {
                                                        document.getElementById('side-menu')?.click();
                                                    }
                                                } className="text-gray-800 hover:bg-gray-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium">
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
                            <img className="h-14 w-14" src="/logo.svg" alt="Logo" />
                        </div>
                        <div className="hidden sm:ml-6 sm:block">
                            <div className="flex space-x-4 justify-center items-center h-full">
                                {MENU.map((item) => (
                                    <a key={`${item.name}`} href={item.link} className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium">
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">                       
                        <div className='flex items-center gap-2'>
                            <ThemeSwitchButtons/>
                            <IconButton icon="bell" indicator={3}/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden sm:hidden" id="mobile-menu">
                <div className="space-y-1 px-2 pb-3 pt-2">
                    {MENU.map((item) => (
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