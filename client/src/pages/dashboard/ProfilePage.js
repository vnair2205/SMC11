import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FiCamera } from 'react-icons/fi';

import PersonalInfo from '../../components/profile/PersonalInfo';
import Bio from '../../components/profile/Bio';
import LearnsProfile from '../../components/profile/LearnsProfile';
import Preloader from '../../components/common/Preloader';

// --- Styled Components ---

const ProfilePageContainer = styled.div`
  padding: 2rem;
  color: white;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  background-color: #1e1e2d;
  padding: 2rem;
  border-radius: 12px;
`;

const AvatarContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const ProfilePicture = styled.img`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.colors.primary};
  object-fit: cover;
`;

const CameraOverlay = styled.div`
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UserInfo = styled.div`
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
  }
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 1.1rem;
  }
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #444;
  margin-bottom: 2rem;
`;

const TabButton = styled.button`
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: ${({ active, theme }) => (active ? theme.colors.primary : theme.colors.textSecondary)};
  cursor: pointer;
  font-size: 1.1rem;
  border-bottom: 3px solid ${({ active, theme }) => (active ? theme.colors.primary : 'transparent')};
  transition: all 0.2s ease;
`;

const TabContent = styled.div`
  background-color: #1e1e2d;
  border-radius: 12px;
`;

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'bio', 'learns'

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const config = { headers: { 'x-auth-token': token } };
                const { data } = await axios.get('/api/profile', config);
                setUser(data);
            } catch (error) {
                console.error("Failed to fetch profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <Preloader />;

    return (
        <ProfilePageContainer>
            <ProfileHeader>
                <AvatarContainer>
                    <ProfilePicture src={user?.profilePicture} alt="Profile" />
                    <CameraOverlay><FiCamera size={20} /></CameraOverlay>
                </AvatarContainer>
                <UserInfo>
                    <h1>{`${user?.firstName} ${user?.lastName}`}</h1>
                    <p>{user?.email}</p>
                </UserInfo>
            </ProfileHeader>

            <TabContainer>
                <TabButton active={activeTab === 'personal'} onClick={() => setActiveTab('personal')}>Personal Info</TabButton>
                <TabButton active={activeTab === 'bio'} onClick={() => setActiveTab('bio')}>Bio</TabButton>
                <TabButton active={activeTab === 'learns'} onClick={() => setActiveTab('learns')}>LEARNS Profile</TabButton>
            </TabContainer>

            <TabContent>
                {activeTab === 'personal' && <PersonalInfo user={user} />}
                {activeTab === 'bio' && <Bio user={user} />}
                {activeTab === 'learns' && <LearnsProfile user={user} />}
            </TabContent>
        </ProfilePageContainer>
    );
};

export default ProfilePage;