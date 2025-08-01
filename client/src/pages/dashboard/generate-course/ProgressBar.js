import React from 'react';
import { ProgressBarContainer, ProgressStep, StepCircle, StepLabel } from './GenerateCourse.styles';

const ProgressBar = ({ currentStep }) => {
    // New step order
    const steps = [
        "Language",
        "Topic",
        "Objective",
        "Outcome",
        "Subtopics",
        "Index"
    ];

    return (
        <ProgressBarContainer>
            {steps.map((step, index) => (
                <ProgressStep key={index}>
                    <StepCircle active={index + 1 <= currentStep}>{index + 1}</StepCircle>
                    <StepLabel active={index + 1 <= currentStep}>{step}</StepLabel>
                </ProgressStep>
            ))}
        </ProgressBarContainer>
    );
};

export default ProgressBar;