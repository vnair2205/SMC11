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

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const Tag = styled.span`
  background-color: #33333d;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
`;

const LearnsProfile = ({ user }) => {
  return (
    <SectionWrapper>
      <SectionTitle>Learning Goals</SectionTitle>
      <TagContainer>
        {user?.learningGoals?.length > 0 ? user.learningGoals.map(goal => <Tag key={goal}>{goal}</Tag>) : <p>No goals selected.</p>}
      </TagContainer>
    </SectionWrapper>
  );
};

export default LearnsProfile;