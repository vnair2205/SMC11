import React from 'react';
import styled from 'styled-components';
import {
    StepContentContainer,
    StepHeader,
    StepTitle,
    StepDescription,
    NavigationButtons,
    NavButton
} from './GenerateCourse.styles';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const OptionsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const OptionButton = styled.button`
  padding: 1.5rem 2.5rem;
  border-radius: 8px;
  border: 2px solid ${({ active, theme }) => (active ? theme.colors.primary : '#555')};
  background-color: ${({ active, theme }) => (active ? theme.colors.primary + '20' : 'transparent')};
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Step4_Subtopics = ({ nextStep, prevStep, updateCourseData, data }) => {
    const { t } = useTranslation(); // Initialize useTranslation
    const handleSelect = (num) => {
        updateCourseData({ numSubtopics: num });
    };
    
    const subtopicOptions = [1, 5, 10, 15];

    return (
        <StepContentContainer>
            <StepHeader>
                <StepTitle>{t('course_generation.step4_title')}</StepTitle> {/* Translated */}
                <StepDescription>{t('course_generation.step4_description')}</StepDescription> {/* Translated */}
            </StepHeader>

            <OptionsContainer>
                {subtopicOptions.map(num => (
                    <OptionButton
                        key={num}
                        active={data.numSubtopics === num}
                        onClick={() => handleSelect(num)}
                    >
                        {num} {t(num === 1 ? 'course_generation.subtopic_label' : 'course_generation.subtopics_label', { count: num })} {/* Translated with pluralization */}
                    </OptionButton>
                ))}
            </OptionsContainer>

            <NavigationButtons>
                <NavButton onClick={prevStep}>{t('course_generation.back_button')}</NavButton> {/* Translated */}
                <NavButton primary onClick={nextStep} disabled={!data.numSubtopics}>{t('course_generation.next_button')}</NavButton> {/* Translated */}
            </NavigationButtons>
        </StepContentContainer>
    );
};

export default Step4_Subtopics;