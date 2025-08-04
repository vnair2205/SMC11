import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { FiBell, FiGlobe } from 'react-icons/fi';
import LanguageSwitcher from '../common/LanguageSwitcher';

const expandedWidth = '300px';
const collapsedWidth = '88px';

// Use $isCollapsed and $dir for transient props
const HeaderContainer = styled.header`
    position: fixed;
    top: 0;
    height: 80px;
    z-index: 50;
    display: flex;
    align-items: center;
    padding: 1rem 2rem;
    gap: 1.5rem;
    transition: left 0.3s ease-in-out, right 0.3s ease-in-out;

    /* These dynamic styles ensure the header and its content are always in the correct place */
    left: ${({ $isCollapsed, $dir }) => 
        $dir === 'rtl' ? '0' : ($isCollapsed ? collapsedWidth : expandedWidth)};
    
    right: ${({ $isCollapsed, $dir }) => 
        $dir === 'rtl' ? ($isCollapsed ? collapsedWidth : expandedWidth) : '0'};

    justify-content: ${({ $dir }) => ($dir === 'rtl' ? 'flex-start' : 'flex-end')};
`;

const HeaderSwitcherWrapper = styled.div`
    width: 150px;
    & > div {
        margin-bottom: 0;
    }
`;

const NotificationCircle = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
  }
`;

const Header = ({ isCollapsed }) => {
    const { i18n } = useTranslation();

    return (
        <HeaderContainer $isCollapsed={isCollapsed} $dir={i18n.dir()}> {/* Pass as transient props */}
            <FiGlobe size={24} color="white" style={{ cursor: 'pointer' }} />
            
            <HeaderSwitcherWrapper>
                <LanguageSwitcher variant="header" />
            </HeaderSwitcherWrapper>

            <NotificationCircle>
                <FiBell size={20} color="#1e1e2d" />
            </NotificationCircle>
        </HeaderContainer>
    );
};

export default Header;