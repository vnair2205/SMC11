import React from 'react';
import styled from 'styled-components';

const SectionWrapper = styled.div`
  padding: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const InfoItem = styled.div`
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  h4 {
    margin: 0.25rem 0 0 0;
    font-size: 1.1rem;
    color: white;
  }
`;

const PersonalInfo = ({ user }) => {
  return (
    <SectionWrapper>
      <SectionTitle>Personal Info</SectionTitle>
      <InfoGrid>
        <InfoItem>
          <p>First Name</p>
          <h4>{user?.firstName || 'John'}</h4>
        </InfoItem>
        <InfoItem>
          <p>Last Name</p>
          <h4>{user?.lastName || 'Doe'}</h4>
        </InfoItem>
        <InfoItem>
          <p>Email Address</p>
          <h4>{user?.email || 'john.doe@example.com'}</h4>
        </InfoItem>
        <InfoItem>
          <p>Phone Number</p>
          <h4>{user?.phone || 'Not Provided'}</h4>
        </InfoItem>
      </InfoGrid>
    </SectionWrapper>
  );
};

export default PersonalInfo;