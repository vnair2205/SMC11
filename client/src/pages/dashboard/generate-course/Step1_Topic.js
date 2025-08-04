// SM10/client/src/pages/dashboard/generate-course/Step1_Topic.js

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
    StepContentContainer,
    StepHeader,
    StepTitle,
    StepDescription,
    InputWrapper,
    AnimatedPlaceholder,
    StyledInput,
    NavigationButtons,
    NavButton
} from './GenerateCourse.styles';
import { useTranslation } from 'react-i18next';

const ApiErrorText = styled.p`
    color: ${({ theme }) => theme.colors.error};
    text-align: center;
    margin-top: 1rem;
    min-height: 20px;
`;

const Step1_Topic = ({ nextStep, prevStep, updateCourseData, data, isLoading, error }) => {
    const { t } = useTranslation();
    const isRTL = ['ar', 'ur'].includes(data.language);

    // Define placeholder texts using translation keys
    // You will need to add these keys to your translation.json files
    const translatedPlaceholderExamples = [
        t("placeholder.example1"), // e.g., "The history of ancient Rome..."
        t("placeholder.example2"), // e.g., "Introduction to quantum computing..."
        t("placeholder.example3"), // e.g., "Mastering sourdough bread baking..."
        t("placeholder.example4"), // e.g., "Basics of financial literacy..."
        t("placeholder.example5")  // e.g., "Beginner's guide to digital art..."
    ];

    const [animatedPlaceholderText, setAnimatedPlaceholderText] = useState(translatedPlaceholderExamples[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            const currentIndex = translatedPlaceholderExamples.indexOf(animatedPlaceholderText);
            const nextIndex = (currentIndex + 1) % translatedPlaceholderExamples.length;
            setAnimatedPlaceholderText(translatedPlaceholderExamples[nextIndex]);
        }, 4000); // Adjust animation speed as needed
        return () => clearInterval(interval);
    }, [animatedPlaceholderText, translatedPlaceholderExamples]); // Added translatedPlaceholderExamples to dependencies

    // Determine if the animated placeholder should be shown
    const showAnimatedPlaceholder = (!data.topic || data.topic.trim() === '');

    return (
        <StepContentContainer>
            <StepHeader>
                <StepTitle>{t('course_generation.step1_title')}</StepTitle>
                <StepDescription>{t('course_generation.step1_description')}</StepDescription>
            </StepHeader>

            <InputWrapper>
                <StyledInput
                    type="text"
                    value={data.topic || ''}
                    onChange={(e) => updateCourseData({ topic: e.target.value })}
                    // Conditionally set placeholder: empty if animated one is shown, else use translated static one
                    placeholder={showAnimatedPlaceholder ? "" : t('placeholder.enterTopic')}
                    disabled={isLoading}
                    dir={isRTL ? 'rtl' : 'ltr'}
                />
                {showAnimatedPlaceholder && (
                     <AnimatedPlaceholder key={animatedPlaceholderText}>{animatedPlaceholderText}</AnimatedPlaceholder>
                )}
            </InputWrapper>

            <ApiErrorText>{error}</ApiErrorText>

            <NavigationButtons>
                <NavButton onClick={prevStep} disabled={isLoading}>
                    {t('course_generation.back_button')}
                </NavButton>
                <NavButton
                    primary
                    onClick={nextStep}
                    disabled={!data.topic || isLoading}
                >
                    {isLoading ? t('course_generation.generating_button') : t('course_generation.next_button')}
                </NavButton>
            </NavigationButtons>
        </StepContentContainer>
    );
};

export default Step1_Topic;