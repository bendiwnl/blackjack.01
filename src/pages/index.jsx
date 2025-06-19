import Layout from "./Layout.jsx";

import GameTable from "./GameTable";

import DealerPanel from "./DealerPanel";

import Wallet from "./Wallet";

import AdminPanel from "./AdminPanel";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    GameTable: GameTable,
    
    DealerPanel: DealerPanel,
    
    Wallet: Wallet,
    
    AdminPanel: AdminPanel,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<GameTable />} />
                
                
                <Route path="/GameTable" element={<GameTable />} />
                
                <Route path="/DealerPanel" element={<DealerPanel />} />
                
                <Route path="/Wallet" element={<Wallet />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}