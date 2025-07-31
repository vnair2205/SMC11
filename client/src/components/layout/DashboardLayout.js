import React, { useState } from 'react';
import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';

const LayoutContainer = styled.div`
  display: flex;
  background-color: #27293d; 
`;

const expandedWidth = '300px';
const collapsedWidth = '88px';

// Use $isCollapsed and $dir for transient props
const ContentContainer = styled.main`
  flex-grow: 1;
  margin-left: ${({ $isCollapsed, $dir }) => ($dir === 'rtl' ? '0' : ($isCollapsed ? collapsedWidth : expandedWidth))};
  margin-right: ${({ $isCollapsed, $dir }) => ($dir === 'rtl' ? ($isCollapsed ? collapsedWidth : expandedWidth) : '0')}; /* CORRECTED: changed isCollapsed to $isCollapsed */
  padding: 2rem;
  padding-top: 100px; /* Space for the fixed header */
  height: 100vh;
  overflow-y: auto;
  transition: margin-left 0.3s ease-in-out, margin-right 0.3s ease-in-out;
`;

const DashboardLayout = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { i18n } = useTranslation();

    return (
        <LayoutContainer>
            <Header isCollapsed={isCollapsed} />
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <ContentContainer $isCollapsed={isCollapsed} $dir={i18n.dir()}>
                <Outlet />
            </ContentContainer>
        </LayoutContainer>
    );
};

export default DashboardLayout;