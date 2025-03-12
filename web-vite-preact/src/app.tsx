import { LocationProvider, ErrorBoundary, Router, Route, useLocation } from 'preact-iso';
import Navbar from './layout/Navbar';
import About from './page/about';
import WifiManager from './page/wifiManager';
import { FunctionalComponent } from 'preact';
import { useEffect } from 'preact/hooks';

/** fall-back route (handles unroutable URLs) */
interface ErrorProps {
  type: number;
  url: string;
}

const Error: FunctionalComponent<ErrorProps> = ({ type, url }) => {
  //force redirect to home page
  const { route } = useLocation();

  useEffect(() => {
    console.log("Redirecting to /");
    route("/", true); //redirect to home page
  }, []);
  return (
    <div>
      <h1>Error {type}</h1>
      <p>Page not found: {url}</p>
    </div>
  );
};

export function App() {

  return (
    <LocationProvider>
      <ErrorBoundary>
        <div className="flex flex-col h-screen">
          <Navbar />
          <main class="w-full flex flex-grow overflow-auto">
            <div className="mx-auto w-full max-w-screen-xl px-4 py-6" id="main">
              <Router>
                <Route path="/" component={WifiManager} />
                <Route path="/about" component={About} />
                <Route default component={() => <Error type={404} url={window.location.href} />} />
              </Router>
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </LocationProvider>
  )
}
