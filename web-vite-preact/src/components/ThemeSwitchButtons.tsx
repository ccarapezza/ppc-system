import { useState, useEffect } from 'preact/hooks';
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
        <IconButton icon={isDarkMode ? "moon" : "sun"} onClick={() => setIsDarkMode(!isDarkMode)} />
    )
}

export default ThemeSwitchButtons