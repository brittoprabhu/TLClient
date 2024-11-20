import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Routes, useParams, useLocation } from 'react-router-dom';

import VerticalMenu from '../features/VerticalMenu';
import DynamicForm from '../features/DynamicForm';


const DynamicFormOnly = () => {
    const { recordId } = useParams<{ recordId: string }>();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const jsonFileName = queryParams.get('jsonFileName') || '';

    return <DynamicForm jsonFileName={jsonFileName} recordId={recordId} onNewRecordCreated={() => console.log("Record created!")} />;
};

const MainLayout: React.FC = () => (
    <div>
        
        <VerticalMenu />  {/* Vertical Menu Component */}
    </div>
);

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                {/* Main layout with top banner and vertical menu */}
                <Route path="/*" element={<MainLayout />} />
                {/* Route specifically for DynamicForm without layout */}
                <Route path="/dynamicform/:recordId" element={<DynamicFormOnly />} />
            </Routes>
        </Router>
    );
};

export default App;
