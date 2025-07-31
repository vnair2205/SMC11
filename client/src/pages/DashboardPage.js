import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DashboardContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
`;

const WelcomeMessage = styled.h1`
    font-size: 2rem;
`;

const InfoText = styled.p`
    margin-top: 1rem;
    color: #a0a0a0;
`;

const DashboardPage = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const config = {
                    headers: {
                        'x-auth-token': token
                    }
                };
                
                const res = await axios.get('/api/dashboard', config);
                setUserData(res.data);

            } catch (err) {
                console.error("Auth Error:", err.response?.data?.msg);
                setError('Your session has expired or was terminated. Please log in again.');
                
                localStorage.removeItem('token');
                setTimeout(() => navigate('/login'), 2000);
            }
        };

        fetchDashboardData();
    }, [navigate]);


    return (
        <DashboardContainer>
            {userData && <WelcomeMessage>{userData.message}</WelcomeMessage>}
            {error && <InfoText>{error}</InfoText>}
            {!userData && !error && <InfoText>Loading dashboard...</InfoText>}
        </DashboardContainer>
    );
};

export default DashboardPage;