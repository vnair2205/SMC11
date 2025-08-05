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

const AboutSection = styled.div`
  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    line-height: 1.8;
  }
`;


const Bio = ({ user }) => {
  return (
    <SectionWrapper>
      <SectionTitle>About Me</SectionTitle>
      <AboutSection>
        <p>{user?.about || 'Tell us something about yourself...'}</p>
      </AboutSection>
    </SectionWrapper>
  );
};

export default Bio;