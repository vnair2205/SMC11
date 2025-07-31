import React from 'react';
import styled from 'styled-components';
import { Outlet } from 'react-router-dom';
import logo from '../../assets/seekmycourse_logo.png';

const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  min-height: 100vh;
`;

const Header = styled.header`
  padding: 1rem 2rem;
  border-bottom: 1px solid #444;
`;

const Logo = styled.img`
  width: 150px;
`;

const Content = styled.main`
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
`;

const PublicLayout = () => {
    return (
        <PageContainer>
            <Header>
                <Logo src={logo} alt="SeekMYCOURSE Logo" />
            </Header>
            <Content>
                <Outlet /> {/* The public page content will render here */}
            </Content>
        </PageContainer>
    );
};

export default PublicLayout;