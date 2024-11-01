//import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import React, { useEffect, useState } from 'react'
import IconButton from './IconButton';

function ThemeSwitchButtons() {

    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <IconButton icon={isDarkMode ? "A" : "B"} color='gray' onClick={() => setIsDarkMode(!isDarkMode)} />
    )
}

export default ThemeSwitchButtons