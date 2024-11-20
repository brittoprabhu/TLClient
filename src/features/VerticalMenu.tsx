import React, { useState, useEffect } from 'react';
import { ListGroup, Collapse } from 'react-bootstrap';
import { FaBars } from 'react-icons/fa';
import RecordList from '../features/RecordList';

interface MenuConfig {
    [key: string]: string;
}

const VerticalMenu: React.FC = () => {
    const [menuItems, setMenuItems] = useState<MenuConfig | null>(null);
    const [activeParameter, setActiveParameter] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(true);

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const response = await fetch('/schemas/menu.json');
                if (!response.ok) throw new Error('Network response was not ok');
                const data: MenuConfig = await response.json();
                setMenuItems(data);
            } catch (error) {
                console.error('Error loading menu items:', error);
            }
        };
        fetchMenuItems();
    }, []);

    const handleMenuClick = (parameter: string) => {
        const schemaPath = `public/schemas/${parameter}.json`;
        setActiveParameter(schemaPath);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="layout">
            {/* Top Banner */}
            <div className="top-banner">
                <FaBars className="menu-icon" onClick={toggleMenu} />
                <div className="app-name">My Application</div>
            </div>

            <div className="main-container">
                {/* Collapsible Sidebar Menu */}
                <Collapse in={isMenuOpen} dimension="width">
                    <div className={`vertical-menu ${isMenuOpen ? '' : 'collapsed'}`}>
                        <ListGroup className="menu-list">
                            {menuItems ? (
                                Object.entries(menuItems).map(([name, parameter]) => (
                                    <ListGroup.Item
                                        action
                                        key={name}
                                        onClick={() => handleMenuClick(parameter)}
                                        className={`menu-item ${activeParameter === `schemas/${parameter}.json` ? 'active' : ''}`}
                                    >
                                        {name}
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <div>Loading menu...</div>
                            )}
                        </ListGroup>
                    </div>
                </Collapse>

                {/* Main Content Area */}
                <div className="content-area">
                    {activeParameter ? (
                        <RecordList jsonFileName={activeParameter}  />
                    ) : (
                        <div className="content-placeholder">Please select a menu item</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerticalMenu;
