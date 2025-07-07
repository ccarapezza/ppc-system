import { icon, IconName, IconPrefix } from '@fortawesome/fontawesome-svg-core';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRotate, faCoffee, faCheckCircle, faCat, faAtom, faHome, faBars, faBell, faUser, faSun, faMoon, faWifi, faEnvelope, faSignal, faLock, faLockOpen, faCircleNotch, faPlugCircleXmark, faRobot, faSpinner, faStopwatch, faCalendar, faChevronDown, faClock, faRightLong, faCheck, faExclamationTriangle, faArrowLeft, faArrowRight, faEllipsisVertical, faPlus, faEdit, faSignIn, faGlobe, faXmark, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
library.add(faRotate, faCoffee, faCheckCircle, faCat, faAtom, faHome, faBars, faBell, faUser, faSun, faMoon, faWifi, faStopwatch, faEnvelope, faSignal, faLock, faLockOpen, faCircleNotch, faPlugCircleXmark,faRobot, faSpinner, faCalendar, faBell, faChevronDown, faClock, faRightLong, faCheck, faExclamationTriangle, faArrowLeft, faArrowRight, faEllipsisVertical, faPlus, faEdit, faSignIn, faGlobe, faXmark, faEye, faEyeSlash);

interface FontAwesomeIconProps {
  prefix?: IconPrefix;
  icon: IconName;
  className?: string;
}

const FontAwesomeIcon = ({ icon: iconName, prefix = 'fas', className }: FontAwesomeIconProps) => {
  const faIcon = icon({ prefix: prefix, iconName: iconName });

  if (faIcon) {
    return <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${faIcon.icon[0]} ${faIcon.icon[1]}`}
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
    >
      <path fill="currentColor" d={Array.isArray(faIcon.icon[4]) ? faIcon.icon[4].join(' ') : faIcon.icon[4]}></path>
    </svg>;

  }
  if (!faIcon) {
    console.warn(`Icono no encontrado: fa-${iconName}, por favor importe el icono y agreguelo a la biblioteca.`);
    return <small className={"text-red-500"}>fa-{iconName}</small>;
  }
};

export { FontAwesomeIcon };