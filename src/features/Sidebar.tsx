// src/components/Sidebar.tsx
import React from 'react';
import { Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar: React.FC = () => {
    return (
        <div className="sidebar flex-shrink-0 p-3" style={{ backgroundColor: '#f8f9fa', height: '100vh' }}>
            <h4>Sidebar Menu</h4>
            <Nav className="flex-column">
                <Nav.Link href="#" active>Home</Nav.Link>
                <Nav.Link href="#">Profile</Nav.Link>
                <Nav.Link href="#">Settings</Nav.Link>
                <Nav.Link href="#">Logout</Nav.Link>
            </Nav>
        </div>
    );
};

export default Sidebar;
