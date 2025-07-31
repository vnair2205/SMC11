import React from 'react';
import {
    StepContentContainer,
    StepHeader,
    StepTitle,
    StepDescription,
    StyledTextarea,
    NavigationButtons,
    NavButton
} from './GenerateCourse.styles';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Step2_Objective = ({ nextStep, prevStep, updateCourseData, data, isLoading }) => {
    const { t } = useTranslation(); // Initialize useTranslation
    const isRTL = ['ar', 'ur'].includes(data.language);

    return (
        <StepContentContainer>
            <StepHeader>
                <StepTitle>{t('course_generation.step2_title')}</StepTitle> {/* Translated */}
                <StepDescription>{t('course_generation.step2_description')}</StepDescription> {/* Translated */}
            </StepHeader>

            <StyledTextarea
                // Removed the comment from inside the JSX attribute to fix the syntax error
                value={data.objective || t('course_generation.loading_text')}
                onChange={(e) => updateCourseData({ objective: e.target.value })}
                disabled={isLoading || !data.objective}
                dir={isRTL ? 'rtl' : 'ltr'}
            />

            <NavigationButtons>
                <NavButton onClick={prevStep} disabled={isLoading}>{t('course_generation.back_button')}</NavButton> {/* Translated */}
                <NavButton primary onClick={nextStep} disabled={isLoading}>
                    {isLoading ? t('course_generation.generating_button') : t('course_generation.next_button')} {/* Translated */}
                </NavButton>
            </NavigationButtons>
        </StepContentContainer>
    );
};

export default Step2_Objective;