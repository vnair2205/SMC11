import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
    StepContentContainer,
    StepHeader,
    StepTitle,
    StepDescription,
    NavigationButtons,
    NavButton
} from './GenerateCourse.styles';

const OutcomesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
`;

const OutcomeBox = styled.div`
    background-color: #33333d;
    border: 1px solid #555;
    border-radius: 8px;
    padding: 1rem;
    font-size: 1rem;
    color: white;
    display: flex;
    align-items: center;
`;

const OutcomeNumber = styled.span`
    font-weight: bold;
    color: ${({ theme }) => theme.colors.primary};
    margin-right: 1rem;
`;

const OutcomeText = styled.span`
    flex-grow: 1;
`;

const Step3_Outcome = ({ nextStep, prevStep, data, isLoading }) => {
    const { t } = useTranslation();
    const isRTL = ['ar', 'ur'].includes(data.language);

    const outcomesArray = data.outcome;

    return (
        <StepContentContainer dir={isRTL ? 'rtl' : 'ltr'}>
            <StepHeader>
                <StepTitle>{t('course_generation.step3_title')}</StepTitle>
                <StepDescription>{t('course_generation.step3_description')}</StepDescription>
            </StepHeader>

            <OutcomesList>
                {outcomesArray.map((outcome, index) => (
                    <OutcomeBox key={index} dir={isRTL ? 'rtl' : 'ltr'}>
                        <OutcomeNumber>{index + 1}.</OutcomeNumber>
                        <OutcomeText>{outcome}</OutcomeText>
                    </OutcomeBox>
                ))}
            </OutcomesList>

            <NavigationButtons>
                <NavButton onClick={prevStep} disabled={isLoading}>{t('course_generation.back_button')}</NavButton>
                <NavButton primary onClick={nextStep} disabled={isLoading || outcomesArray.length === 0}>
                    {isLoading ? t('course_generation.generating_button') : t('course_generation.next_button')}
                </NavButton>
            </NavigationButtons>
        </StepContentContainer>
    );
};

export default Step3_Outcome;