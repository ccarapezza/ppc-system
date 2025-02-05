import Router, { Route } from 'preact-router';

import Navbar from './layout/Navbar';
import About from './page/about';
import WifiManager from './page/wifiManager';

export function App() {

  return (
    <div className="flex flex-col h-screen">
      <Navbar/>
      <main class="w-full flex flex-grow overflow-auto">
        <div className="mx-auto w-full max-w-screen-xl px-4 py-6" id="main">
          <Router>
            <Route path="/" component={WifiManager} />
            <Route path="/about" component={About} />
          </Router>
        </div>
      </main>
    </div>
  )
}
