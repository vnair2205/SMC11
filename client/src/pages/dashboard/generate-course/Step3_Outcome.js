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

const Step3_Outcome = ({ nextStep, prevStep, updateCourseData, data, isLoading }) => {
    const { t } = useTranslation(); // Initialize useTranslation
    const isRTL = ['ar', 'ur'].includes(data.language);

    return (
        <StepContentContainer>
            <StepHeader>
                <StepTitle>{t('course_generation.step3_title')}</StepTitle> {/* Translated */}
                <StepDescription>{t('course_generation.step3_description')}</StepDescription> {/* Translated */}
            </StepHeader>

            <StyledTextarea
                // Removed the comment from inside the JSX attribute to fix the syntax error
                value={data.outcome || t('course_generation.loading_text')}
                onChange={(e) => updateCourseData({ outcome: e.target.value })}
                disabled={isLoading || !data.outcome}
                dir={isRTL ? 'rtl' : 'ltr'}
            />

            <NavigationButtons>
                <NavButton onClick={prevStep} disabled={isLoading}>{t('course_generation.back_button')}</NavButton> {/* Translated */}
                <NavButton primary onClick={nextStep} disabled={isLoading}>{t('course_generation.next_button')}</NavButton> {/* Translated */}
            </NavigationButtons>
        </StepContentContainer>
    );
};

export default Step3_Outcome;